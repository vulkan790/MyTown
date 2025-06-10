import { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';

import { ok, err, fromPromise, type Result } from 'neverthrow';

import { and, desc, eq, or, sql, sum, isNull, inArray, asc } from 'drizzle-orm';
import { problems, problemVotes, problemImages, problemComments, users } from '../db/schema.js';

import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

import { JwtPayload } from '../auth/jwt.js';

export const PROBLEM_STATUS = {
  WAIT_FOR_SOLVE: 'wait_for_solve',
  SOLVING: 'solving',
  SOLVED: 'solved',
  REJECTED: 'rejected',
  ON_MODERATION: 'on_moderation',
} as const;

type Paginated<T> = {
  total: number;
  page: number;
  problems: T[];
};

type Problem = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  images: string[];
  votes: number;
  author: {
    id: number;
    firstName: string;
    avatarUrl: string;
  };
  createdAt: string;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;

  author: {
    firstName: string;
    lastName: string;
    middleName: string;
    avatarUrl: string;
  };
};

type RichProblem = Problem & {
  comments: Comment[];
  createdAt: string;
  vote: number;
};

type AddressSuggestion = {
  title: string;
  subtitle: string;
  uri: string;
};

type UploadedeProblemImage = {
  id: number;
  url: string;
};

type UploadProblemImageError = 'unknown_error' | 'no_image' | 'invalid_mime';

type CreateProblemPayload = {
  title: string;
  description: string;
  uri: string;
  images: number[];
};

type GetProblemsParams = {
  page: number;
  limit: number;
  type?: 'moderation' | 'pending' | 'solving' | (string & {});
  user: JwtPayload | null;
};

type CreateProblemError = 'unknown_error';

type CreateProblemResult = Result<{ id: number }, CreateProblemError>;

type ModerationErrors = 'unknown_problem' | 'unknown_error' | 'forbidden' | 'already_moderated';

type AddCommentErrors = 'forbidden' | 'unknown_problem' | 'problem_is_closed' | 'unknown_error';

type VoteErrors = 'problem_is_closed' | 'unknown_problem' | 'unknown_error';

type SolveProblemErrors = 'problem_is_closed' | 'forbidden' | 'unknown_problem' | 'unknown_error';

export const registerProblemsService = async (fastify: FastifyInstance) => {
  const { drizzle } = fastify;

  const getProblems = async ({
    page,
    limit,
    type,
    user = null,
  }: GetProblemsParams): Promise<Result<Paginated<Problem>, 'unknown_error'>> => {
    const votesCTE = drizzle.$with('aggregated_votes').as(
      drizzle
        .select({
          votes: sum(problemVotes.vote)
            .mapWith((n): number | null => Number(n))
            .as('votes'),
          problemId: problemVotes.problemId,
        })
        .from(problemVotes)
        .groupBy(problemVotes.problemId)
    );

    const imagesCTE = drizzle.$with('aggregated_images').as(
      drizzle
        .select({
          images: sql`JSON_ARRAYAGG(${problemImages.imageUrl})`
            .mapWith((n): string[] | null => JSON.parse(n))
            .as('images'),
          problemId: problemImages.problemId,
        })
        .from(problemImages)
        .groupBy(problemImages.problemId)
    );

    const problemsSelect = drizzle.with(votesCTE, imagesCTE).select({
      total: sql`COUNT(${problems.id}) OVER ()`.mapWith(Number).as('total'),
      id: problems.id,
      title: problems.title,
      description: problems.description,
      latitude: problems.latitude,
      longitude: problems.longitude,
      status: problems.status,
      images: sql<string[]>`COALESCE(${imagesCTE.images}, JSON_ARRAY())`.as('images'),
      votes: sql<number>`COALESCE(${votesCTE.votes}::integer, 0)`.as('votes'),
      createdAt: problems.createdAt,

      author: {
        id: users.id,
        firstName: users.firstName,
        avatarUrl: users.avatarUrl,
      },
    })
      .from(problems)
      .leftJoin(votesCTE, eq(problems.id, votesCTE.problemId))
      .leftJoin(imagesCTE, eq(problems.id, imagesCTE.problemId))
      .leftJoin(users, eq(problems.userId, users.id))
      .where(or(
        eq(problems.status, PROBLEM_STATUS.WAIT_FOR_SOLVE),
        eq(problems.status, PROBLEM_STATUS.SOLVING),
        eq(problems.status, PROBLEM_STATUS.SOLVED)
      ))
      .orderBy(desc(problems.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

      .$dynamic();

    // TODO: check for user roles
    switch (type) {
      case 'moderation':
        if (!user || (user.role !== 'admin' && user.role !== 'mod')) break;

        problemsSelect.where(eq(problems.status, PROBLEM_STATUS.ON_MODERATION));
        problemsSelect.orderBy(asc(problems.createdAt));
        break;

      case 'pending':
        if (!user || (user.role !== 'gov' && user.role !== 'admin')) break;

        problemsSelect.where(eq(problems.status, PROBLEM_STATUS.WAIT_FOR_SOLVE));
        problemsSelect.orderBy(asc(problems.createdAt));
        break;

      case 'solving':
        if (!user || (user.role !== 'gov' && user.role !== 'admin')) break;

        problemsSelect.where(eq(problems.status, PROBLEM_STATUS.SOLVING));
        problemsSelect.orderBy(asc(problems.createdAt));
        break;

      default:
        // No additional filtering
        break;
    }

    const problemsResult = await fromPromise(
      problemsSelect,
      (e) => e
    );

    if (problemsResult.isErr()) {
      console.error('Error during getting overall problems', problemsResult.error);
      return err('unknown_error');
    }

    const problemsCount = problemsResult.value.at(0)?.total ?? 0;
    const problemsList = problemsResult.value.map((problem) => ({
      ...problem,

      createdAt: problem.createdAt!.toISOString(),
      author: problem.author
        ? {
            ...problem.author,
            avatarUrl: problem.author.avatarUrl
              ? problem.author.avatarUrl
              : '',
          }
        : {
            id: -1,
            firstName: 'Удалённый Пользователь',
            avatarUrl: '',
          },
    }));

    return ok({
      total: problemsCount,
      page,

      problems: problemsList,
    });
  };

  const getHotProblems = async (limit: number = 10): Promise<Result<Problem[], 'unknown_error'>> => {
    const votesCTE = drizzle.$with('aggregated_votes').as(
      drizzle
        .select({
          votes: sum(problemVotes.vote)
            .mapWith((n): number | null => Number(n))
            .as('votes'),
          problemId: problemVotes.problemId,
        })
        .from(problemVotes)
        .groupBy(problemVotes.problemId)
    );

    const imagesCTE = drizzle.$with('aggregated_images').as(
      drizzle
        .select({
          images: sql`JSON_ARRAYAGG(${problemImages.imageUrl})`
            .mapWith((n): string[] | null => JSON.parse(n))
            .as('images'),
          problemId: problemImages.problemId,
        })
        .from(problemImages)
        .groupBy(problemImages.problemId)
    );

    const problemsSelect = drizzle.with(votesCTE, imagesCTE).select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      latitude: problems.latitude,
      longitude: problems.longitude,
      status: problems.status,
      images: sql<string[]>`COALESCE(${imagesCTE.images}, JSON_ARRAY())`.as('images'),
      votes: sql<number>`COALESCE(${votesCTE.votes}::integer, 0)`.as('votes'),
      createdAt: problems.createdAt,
      author: {
        id: users.id,
        firstName: users.firstName,
        avatarUrl: users.avatarUrl,
      },
    })
      .from(problems)
      .leftJoin(votesCTE, eq(problems.id, votesCTE.problemId))
      .leftJoin(imagesCTE, eq(problems.id, imagesCTE.problemId))
      .leftJoin(users, eq(problems.userId, users.id))
      .where(or(
        eq(problems.status, PROBLEM_STATUS.WAIT_FOR_SOLVE),
        eq(problems.status, PROBLEM_STATUS.SOLVING)
      ))
      .orderBy(desc(votesCTE.votes))
      .limit(limit);

    const problemsResult = await fromPromise(
      problemsSelect,
      (e) => e
    );

    if (problemsResult.isErr()) {
      console.error('Error during getting hot problems', problemsResult.error);
      return err('unknown_error');
    }

    const problemsList = problemsResult.value.map((problem) => ({
      ...problem,
      createdAt: problem.createdAt!.toISOString(),
      author: problem.author
        ? {
            ...problem.author,
            avatarUrl: problem.author.avatarUrl
              ? problem.author.avatarUrl
              : '',
          }
        : {
            id: -1,
            firstName: 'Удалённый Пользователь',
            avatarUrl: '',
          },
    }));

    return ok(problemsList);
  };

  const getProblem = async (
    id: number,
    user: JwtPayload | null
  ): Promise<Result<RichProblem, 'unknown_problem' | 'unknown_error'>> => {
    const votesCTE = drizzle.$with('aggregated_votes').as(
      drizzle
        .select({
          votes: sum(problemVotes.vote)
            .mapWith((n): number | null => Number(n))
            .as('votes'),
          problemId: problemVotes.problemId,
        })
        .from(problemVotes)
        .groupBy(problemVotes.problemId)
    );

    const imagesCTE = drizzle.$with('aggregated_images').as(
      drizzle
        .select({
          images: sql`JSON_ARRAYAGG(${problemImages.imageUrl})`
            .mapWith((n): string[] | null => JSON.parse(n))
            .as('images'),
          problemId: problemImages.problemId,
        })
        .from(problemImages)
        .groupBy(problemImages.problemId)
    );

    const commentariesCTE = drizzle.$with('aggregated_comments').as(
      drizzle.select({
        problemId: problemComments.problemId,
        comments: sql`JSON_ARRAYAGG(JSON_BUILD_OBJECT(
          'id', ${problemComments.id},
          'content', ${problemComments.content},
          'createdAt', ${problemComments.createdAt},
          'author', JSON_BUILD_OBJECT(
            'firstName', ${users.firstName},
            'lastName', ${users.lastName},
            'middleName', ${users.middleName},
            'avatarUrl', ${users.avatarUrl},
            'role', ${users.role}
          )
        ))`.as('comments'),
      })
        .from(problemComments)
        .leftJoin(users, eq(problemComments.staffId, users.id))
        .groupBy(problemComments.problemId)
    );

    type LocalComment = {
      id: number;
      content: string;
      createdAt: string;
      author: {
        firstName: string;
        lastName: string;
        middleName: string;
        avatarUrl: string | null;
        role: 'gov' | 'mod' | 'admin' | 'user';
      } | null;
    };

    const problemSelect = drizzle
      .with(votesCTE, imagesCTE, commentariesCTE)
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        latitude: problems.latitude,
        longitude: problems.longitude,
        status: problems.status,
        images: sql<string[]>`COALESCE(${imagesCTE.images}, JSON_ARRAY())`.as('images'),
        votes: sql<number>`COALESCE(${votesCTE.votes}::integer, 0)`.as('votes'),
        comments: sql<LocalComment[]>`COALESCE(${commentariesCTE.comments}, JSON_ARRAY())`.as('comments'),
        author: {
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
        },
        createdAt: problems.createdAt,
        vote: problemVotes.vote,
      })
      .from(problems)

      .leftJoin(votesCTE, eq(problems.id, votesCTE.problemId))
      .leftJoin(imagesCTE, eq(problems.id, imagesCTE.problemId))
      .leftJoin(commentariesCTE, eq(problems.id, commentariesCTE.problemId))
      .leftJoin(users, eq(problems.userId, users.id))
      .leftJoin(problemVotes, and(
        eq(problems.id, problemVotes.problemId),
        eq(problemVotes.voterId, user?.userId ?? -1)
      ))

      .where(eq(problems.id, id))
      .limit(1);

    const problemResult = await fromPromise(
      problemSelect,
      (e) => e
    );

    if (problemResult.isErr()) {
      console.error('Error during getting problem', problemResult.error);
      return err('unknown_error');
    }

    const problem = problemResult.value.at(0);
    if (!problem) {
      return err('unknown_problem');
    }

    if (problem.status === PROBLEM_STATUS.ON_MODERATION || problem.status === PROBLEM_STATUS.REJECTED) {
      if (user === null) {
        return err('unknown_problem');
      }

      if (user.role !== 'admin' && user.role !== 'mod' && user.userId !== problem.author?.id) {
        return err('unknown_problem');
      }
    }

    const problemCommentsList = problem.comments.map((comment) => {
      const author = comment.author !== null
        ? {
            ...comment.author,
            avatarUrl: comment.author.avatarUrl ?? '',
          }
        : {
            firstName: 'Удалённый Пользователь',
            lastName: '',
            middleName: '',
            avatarUrl: '',
            role: 'user',
          };

      if (author.role !== 'gov') {
        author.lastName = '';
        author.middleName = '';
      }

      return {
        ...comment,
        author,
      };
    });

    return ok({
      ...problem,

      createdAt: problem.createdAt.toISOString(),
      author: problem.author
        ? {
            ...problem.author,
            avatarUrl: problem.author.avatarUrl
              ? problem.author.avatarUrl
              : '',
          }
        : {
            id: -1,
            firstName: 'Удалённый Пользователь',
            avatarUrl: '',
          },

      comments: problemCommentsList,
      vote: problem.vote ?? 0,
    });
  };

  const getAddressSuggestions = async (
    query: string,
    userId: number
  ): Promise<Result<AddressSuggestion[], 'unknown_error'>> => {
    const suggestionsResult = await fastify.yandexMaps.suggest(query, userId);
    if (suggestionsResult.isErr()) {
      return err('unknown_error');
    }

    return ok(suggestionsResult.value);
  };

  const uploadProblemImage = async (
    file?: MultipartFile['file'],
    mime?: string
  ): Promise<Result<UploadedeProblemImage, UploadProblemImageError>> => {
    if (!file) {
      return err('no_image');
    }

    if (!mime?.startsWith('image/')) {
      return err('invalid_mime');
    }

    const filename = `${randomUUID()}.${mime.split('/')[1]}`;
    const insertImageResult = await fromPromise(
      drizzle.insert(problemImages).values({
        imageUrl: `/uploads/${filename}`,
      })
        .returning({ id: problemImages.id }).then((r) => r.at(0)?.id),
      (e) => e
    );

    if (insertImageResult.isErr()) {
      console.error('Error during image insert', insertImageResult.error);
      return err('unknown_error');
    }

    const filepath = `./uploads/${filename}`;
    const saveResult = await fromPromise(
      pipeline(file, createWriteStream(filepath)),
      (e) => e
    );

    if (saveResult.isErr()) {
      fromPromise(
        drizzle.delete(problemImages).where(eq(problemImages.id, insertImageResult.value!)),
        (e) => e
      ).mapErr((e) => {
        console.error('Error during image delete', e);
      });

      console.error('Error during image save to disk', saveResult.error);
      return err('unknown_error');
    }

    return ok({
      id: insertImageResult.value!,
      url: `/uploads/${filename}`,
    });
  };

  const createProblem = async (
    { title, description, uri, images }: CreateProblemPayload,
    userId: number
  ): Promise<Result<{ id: number }, 'unknown_error'>> => {
    const transaction = drizzle.transaction(async (tx) => {
      const coordinatesResult = await fastify.yandexMaps.geocode(uri);
      if (coordinatesResult.isErr()) {
        return err('unknown_error');
      }

      const coordinates = coordinatesResult.value;
      console.log('coordinates', coordinates);
      const newProblemId = await tx.insert(problems).values({
        title,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        status: PROBLEM_STATUS.ON_MODERATION,
        userId,
      })
        .returning({ id: problems.id })
        .then(r => r.at(0)?.id);

      if (!newProblemId) {
        console.error('Error during problem insert', newProblemId);
        return err('unknown_error');
      }

      await tx.update(problemImages).set({
        problemId: newProblemId,
      }).where(and(
        isNull(problemImages.problemId),
        inArray(problemImages.id, images)
      ));

      return ok({ id: newProblemId });
    }).catch((e) => {
      console.error('Error during create problem transaction', e);
      return err('unknown_error');
    });

    return await transaction;
  };

  const moderateProblem = async (
    id: number,
    status: 'approve' | 'reject',
    user: JwtPayload
  ): Promise<Result<void, ModerationErrors>> => {
    if (user.role !== 'admin' && user.role !== 'mod') {
      return err('forbidden');
    }

    const problemSelect = drizzle
      .select({ id: problems.id, status: problems.status })
      .from(problems)
      .where(eq(problems.id, id));

    const problemResult = await fromPromise(
      problemSelect.then((r) => r.at(0)),
      (e) => e
    );

    if (problemResult.isErr()) {
      console.error('Error during getting problem', problemResult.error);
      return err('unknown_error');
    }

    const problem = problemResult.value;
    if (!problem) {
      return err('unknown_problem');
    }

    if (problem.status !== PROBLEM_STATUS.ON_MODERATION) {
      return err('already_moderated');
    }

    const newStatus = status === 'approve' ? PROBLEM_STATUS.WAIT_FOR_SOLVE : PROBLEM_STATUS.REJECTED;
    const updateResult = await fromPromise(
      drizzle.update(problems).set({
        status: newStatus,
      }).where(eq(problems.id, id)),
      (e) => e
    );

    if (updateResult.isErr()) {
      console.error('Error during problem update', updateResult.error);
      return err('unknown_error');
    }

    return ok();
  };

  const solveProblem = async (
    {
      id,
      status,
    }: { id: number; status: 'claim' | 'resolve' },
    user: JwtPayload
  ): Promise<Result<void, SolveProblemErrors>> => {
    if (user.role !== 'gov') {
      return err('forbidden');
    }

    const problemSelect = drizzle
      .select({ id: problems.id, status: problems.status })
      .from(problems)
      .where(eq(problems.id, id));

    const problemResult = await fromPromise(
      problemSelect.then((r) => r.at(0)),
      (e) => e
    );

    if (problemResult.isErr()) {
      console.error('Error during getting problem for solving', problemResult.error);
      return err('unknown_error');
    }

    const problem = problemResult.value;
    if (!problem) {
      return err('unknown_problem');
    }

    if (problem.status === PROBLEM_STATUS.ON_MODERATION || problem.status === PROBLEM_STATUS.REJECTED) {
      return err('unknown_problem');
    }

    if (problem.status !== PROBLEM_STATUS.WAIT_FOR_SOLVE && problem.status !== PROBLEM_STATUS.SOLVING) {
      return err('problem_is_closed');
    }

    const newStatus = status === 'resolve' ? PROBLEM_STATUS.SOLVED : PROBLEM_STATUS.SOLVING;
    const updateResult = await fromPromise(
      drizzle.update(problems).set({
        status: newStatus,
      }).where(eq(problems.id, id)),
      (e) => e
    );

    if (updateResult.isErr()) {
      console.error('Error during problem update', updateResult.error);
      return err('unknown_error');
    }

    return ok();
  };

  const addComment = async (
    { problemId, content }: { problemId: number; content: string },
    user: JwtPayload
  ): Promise<Result<Comment, AddCommentErrors>> => {
    if (user.role !== 'gov' && user.role !== 'mod') {
      return err('forbidden');
    }

    const transaction = drizzle.transaction(async (tx): Promise<Result<Comment, AddCommentErrors>> => {
      const problemList = await tx
        .select({ id: problems.id, status: problems.status })
        .from(problems)
        .where(eq(problems.id, problemId));

      const problem = problemList.at(0);
      if (!problem) {
        return err('unknown_problem');
      }

      if (problem.status !== PROBLEM_STATUS.WAIT_FOR_SOLVE && problem.status !== PROBLEM_STATUS.SOLVING) {
        return err('problem_is_closed');
      }

      const createdComment = await tx.insert(problemComments).values({
        problemId,
        content,
        staffId: user.userId,
      }).returning().then((r) => r[0]);

      const author = await tx
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          middleName: users.middleName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, user.userId))
        .then((r) => r[0]);

      const comment = {
        ...createdComment,
        createdAt: createdComment.createdAt.toISOString(),

        author: {
          firstName: author.firstName,
          lastName: author.lastName,
          middleName: author.middleName,
          avatarUrl: author.avatarUrl ?? '',
        },
      };

      return ok(comment);
    }).catch((e) => {
      console.error('Error during add comment transaction', e);
      return err('unknown_error');
    });

    return await transaction;
  };

  const vote = async ({
    problemId,
    userId,
    voteValue,
  }: {
    problemId: number;
    userId: number;
    voteValue: number
  }): Promise<Result<void, VoteErrors>> => {
    const problemSelect = drizzle.select({
      id: problems.id,
      status: problems.status,
      vote: problemVotes.vote,
    })
      .from(problems)
      .leftJoin(problemVotes, and(
        eq(problems.id, problemVotes.problemId),
        eq(problemVotes.voterId, userId)
      ))
      .where(eq(problems.id, problemId));

    const problemResult = await fromPromise(
      problemSelect.then((r) => r.at(0)),
      (e) => e
    );

    if (problemResult.isErr()) {
      console.error('Error during getting problem for vote', problemResult.error);
      return err('unknown_error');
    }

    const problem = problemResult.value;
    if (!problem) {
      return err('unknown_problem');
    }

    if (problem.status === PROBLEM_STATUS.ON_MODERATION || problem.status === PROBLEM_STATUS.REJECTED) {
      return err('unknown_problem');
    }

    if (problem.status !== PROBLEM_STATUS.WAIT_FOR_SOLVE && problem.status !== PROBLEM_STATUS.SOLVING) {
      return err('problem_is_closed');
    }

    if (problem.vote !== null) {
      const updateVoteResult = await fromPromise(
        drizzle.update(problemVotes)
          .set({ vote: voteValue })
          .where(and(
            eq(problemVotes.problemId, problemId),
            eq(problemVotes.voterId, userId)
          )),
        (e) => e
      );

      if (updateVoteResult.isErr()) {
        console.error('Error during updating vote', updateVoteResult.error);
        return err('unknown_error');
      }
    } else {
      const insertVoteResult = await fromPromise(
        drizzle.insert(problemVotes).values({
          problemId,
          voterId: userId,
          vote: voteValue,
        }),
        (e) => e
      );

      if (insertVoteResult.isErr()) {
        console.error('Error during inserting vote', insertVoteResult.error);
        return err('unknown_error');
      }
    }

    return ok();
  };

  fastify.decorate('problemService', {
    getProblems,
    getHotProblems,
    getProblem,
    getAddressSuggestions,
    uploadProblemImage,
    createProblem,
    moderateProblem,
    solveProblem,
    addComment,
    vote,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    problemService: {
      getProblems: (payload: GetProblemsParams) => Promise<Result<Paginated<Problem>, 'unknown_error'>>;
      getHotProblems: (limit?: number) => Promise<Result<Problem[], 'unknown_error'>>;
      getProblem: (id: number, user: JwtPayload | null) => Promise<Result<RichProblem, 'unknown_problem' | 'unknown_error'>>;
      getAddressSuggestions: (query: string, userId: number) => Promise<Result<AddressSuggestion[], 'unknown_error'>>;
      uploadProblemImage: (file?: MultipartFile['file'], mime?: string) => Promise<Result<UploadedeProblemImage, UploadProblemImageError>>;
      createProblem: (payload: CreateProblemPayload, userId: number) => Promise<CreateProblemResult>;
      moderateProblem: (id: number, status: 'approve' | 'reject', user: JwtPayload) => Promise<Result<void, ModerationErrors>>;
      solveProblem: (problem: { id: number; status: 'claim' | 'resolve' }, user: JwtPayload) => Promise<Result<void, SolveProblemErrors>>;
      addComment: (commentPayload: { problemId: number; content: string }, user: JwtPayload) => Promise<Result<Comment, AddCommentErrors>>;
      vote: (votePayload: { problemId: number; userId: number; voteValue: number }) => Promise<Result<void, VoteErrors>>;
    };
  }
}
