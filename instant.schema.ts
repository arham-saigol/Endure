import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    missions: i.entity({
      title: i.string().clientRequired(),
      description: i.string().optional(),
      dueDate: i.string().indexed().clientRequired(),
      momentumLine: i.string().optional(),
      momentumLineDate: i.string().optional(),
      createdAt: i.date(),
    }),
    entries: i.entity({
      date: i.string().indexed().clientRequired(),
      rawText: i.string().clientRequired(),
      signal: i.string().optional(),
      summary: i.string().optional(),
      createdAt: i.date(),
    }),
  },
  links: {
    missionUser: {
      forward: { on: "missions", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "missions" },
    },
    entryUser: {
      forward: { on: "entries", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "userEntries" },
    },
    entryMission: {
      forward: { on: "entries", has: "one", label: "mission" },
      reverse: { on: "missions", has: "many", label: "entries" },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
