import { FastifyInstance } from 'fastify';

import { ok, err, fromPromise, type Result } from 'neverthrow';

import { desc, eq, sql, sum } from 'drizzle-orm';
import { problems, problemVotes, problemImages, users } from '../db/schema.js';

type RichUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  role: string;

  problems: {
    id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: string;
    images: string[];
    votes: number;
    createdAt: string;
  }[];
};

export const registerUserService = async (fastify: FastifyInstance) => {
  const { drizzle } = fastify;

  const getCurrentUser = async (
    userId: number
  ): Promise<Result<RichUser, 'user_not_found' | 'unknown_error'>> => {
    const problemVotesCTE = drizzle.$with('aggregated_votes').as(
      drizzle
        .select({
          votes: sum(problemVotes.vote).mapWith((n): number | null => Number(n)).as('votes'),
          problemId: problemVotes.problemId,
        })
        .from(problemVotes)
        .groupBy(problemVotes.problemId)
    );

    const problemImagesCTE = drizzle.$with('aggregated_images').as(
      drizzle
        .select({
          images: sql`JSON_ARRAYAGG(${problemImages.imageUrl})`
            .mapWith((n): string[] | null => JSON.parse(n)).as('images'),
          problemId: problemImages.problemId,
        })
        .from(problemImages)
        .groupBy(problemImages.problemId)
    );

    const problemsCTE = drizzle.$with('aggregated_problems').as(
      drizzle.with(problemVotesCTE, problemImagesCTE).select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        latitude: problems.latitude,
        longitude: problems.longitude,
        status: problems.status,
        images: problemImagesCTE.images,
        votes: problemVotesCTE.votes,
        userId: problems.userId,
        createdAt: problems.createdAt,
      })
        .from(problems)
        .leftJoin(problemVotesCTE, eq(problems.id, problemVotesCTE.problemId))
        .leftJoin(problemImagesCTE, eq(problems.id, problemImagesCTE.problemId))
        .where(eq(problems.userId, userId))
        .orderBy(desc(problems.createdAt))
    );

    const userSelect = drizzle.with(problemsCTE).select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      middleName: users.middleName,
      gender: users.gender,
      role: users.role,
      problems: sql`JSON_ARRAYAGG(row_to_json(${problemsCTE}))`
        .mapWith((n): {
          id: number;
          title: string;
          description: string;
          latitude: number;
          longitude: number;
          status: string;
          created_at: string;
          images: string[] | null;
          votes: number | null;
        }[] | null => n).as('user_problems'),
    })
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(problemsCTE, eq(users.id, problemsCTE.userId))
      .groupBy(users.id)
      .limit(1);

    const userSelectResult = await fromPromise(
      userSelect.then(users => users.at(0)),
      (e) => e
    );

    if (userSelectResult.isErr()) {
      console.error('Error while getting current user', userSelectResult.error);
      return err('unknown_error');
    }

    const user = userSelectResult.value;
    if (!user) {
      return err('user_not_found');
    }

    const richUser = {
      ...user,
      problems: (user.problems ?? []).map((problem) => ({
        ...problem,
        images: problem.images ?? [],
        votes: problem.votes ?? 0,
        createdAt: problem.created_at,
      })),
    };

    return ok(richUser);
  };

  fastify.decorate('userService', {
    getCurrentUser,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    userService: {
      getCurrentUser: (userId: number) => Promise<Result<RichUser, 'user_not_found' | 'unknown_error'>>;
    };
  }
}
