import type { InstantRules } from "@instantdb/react";

// Production permissions for Endure.
// Each user can only read and write their own missions and entries.
//
// Push order matters:
//   1. npx instant-cli@latest push schema   (creates attrs on the backend)
//   2. npx instant-cli@latest push perms    (locks things down)
// If you push perms before schema, clients can't create the attributes they need.

const rules = {
  missions: {
    allow: {
      view: "auth.id in data.ref('user.id')",
      create: "auth.id in data.ref('user.id')",
      update: "auth.id in data.ref('user.id')",
      delete: "auth.id in data.ref('user.id')",
    },
  },
  entries: {
    allow: {
      view: "auth.id in data.ref('user.id')",
      create: "auth.id in data.ref('user.id')",
      update: "auth.id in data.ref('user.id')",
      delete: "auth.id in data.ref('user.id')",
    },
  },
  $users: {
    allow: {
      view: "auth.id == data.id",
    },
  },
  attrs: {
    allow: {
      create: "false",
    },
  },
} satisfies InstantRules;

export default rules;
