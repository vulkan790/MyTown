import { FastifyInstance } from 'fastify';

import { ok, err, fromPromise, type Result } from 'neverthrow';

import { desc, eq, or, sql, sum } from 'drizzle-orm';
import { problems, problemVotes, problemImages, problemComments, users } from '../db/schema.js';

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
  address: string;
  status: string;
  images: string[];
  votes: number;
  author: {
    id: number;
    firstName: string;
    avatarUrl: string;
  };
};

type RichProblem = Problem & {
  comments: {
    id: number;
    content: string;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
      middleName: string;
      avatarUrl: string;
    };
  }[];
  createdAt: string;
};

export const registerProblemsService = async (fastify: FastifyInstance) => {
  const { drizzle } = fastify;

  const getProblems = async (
    page: number,
    limit: number
  ): Promise<Result<Paginated<Problem>, 'unknown_error'>> => {
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
      address: problems.address,
      status: problems.status,
      images: sql<string[]>`COALESCE(${imagesCTE.images}, JSON_ARRAY())`.as('images'),
      votes: sql<number>`COALESCE(${votesCTE.votes}::integer, 0)`.as('votes'),

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
      .offset((page - 1) * limit);

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
            'avatarUrl', ${users.avatarUrl}
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
      createdAt: Date;
      author: {
        firstName: string;
        lastName: string;
        middleName: string;
        avatarUrl: string | null;
      } | null;
    };

    const problemSelect = drizzle
      .with(votesCTE, imagesCTE, commentariesCTE)
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        address: problems.address,
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
      })
      .from(problems)

      .leftJoin(votesCTE, eq(problems.id, votesCTE.problemId))
      .leftJoin(imagesCTE, eq(problems.id, imagesCTE.problemId))
      .leftJoin(commentariesCTE, eq(problems.id, commentariesCTE.problemId))
      .leftJoin(users, eq(problems.userId, users.id))

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

    return ok({
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

      comments: problem.comments.map((comment) => ({
        ...comment,

        createdAt: comment.createdAt.toISOString(),
        author: comment.author
          ? {
              ...comment.author,
              avatarUrl: comment.author.avatarUrl
                ? comment.author.avatarUrl
                : '',
            }
          : {
              firstName: 'Удалённый Пользователь',
              lastName: '',
              middleName: '',
              avatarUrl: '',
            },
      })),
    });
  };

  fastify.decorate('problemService', {
    getProblems,
    getProblem,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    problemService: {
      getProblems: (page: number, limit: number) => Promise<Result<Paginated<Problem>, 'unknown_error'>>;
      getProblem: (id: number, user: JwtPayload | null) => Promise<Result<RichProblem, 'unknown_problem' | 'unknown_error'>>;
    };
  }
}
