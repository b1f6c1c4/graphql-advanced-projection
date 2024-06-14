import { GraphQLFieldResolver, GraphQLResolveInfo  } from 'graphql';

type RawConfig = {};
type PreparedConfig = { root: object, pick: object };
type Projection = object | undefined;
type ProjectMethod = (info: GraphQLResolveInfo) => Projection;
type Resolver = GraphQLFieldResolver<any,any>;

type gqlProjection = (config: RawConfig) => { project: ProjectMethod, resolvers: Resolver };
type prepareConfig = (config: RawConfig) => PreparedConfig;
type genProjection = (config: PreparedConfig) => ProjectMethod;
type genResolvers = (config: PreparedConfig) => Resolver[]


export const gqlProjection: gqlProjection;
export const genProjection: genProjection;
export const genResolvers: genResolvers;
export const prepareConfig: prepareConfig;

export default gqlProjection;
