/* Copyright 2026 Marimo. All rights reserved. */

/** A notebook's kernel and the consumers attached to the notebook. */

import { Schema } from "effect";
import { NotebookId, RuntimeId, AttachmentId } from "./Ids.ts";

export const RuntimeStatus = Schema.Literals([
  "starting",
  "running",
  "terminating",
  "failed",
]).annotate({
  description:
    "Where a runtime is in its life. A `starting` runtime is bringing\nits kernel up. A `running` runtime accepts work. A `terminating`\nruntime is shutting its kernel down. A `failed` runtime could not\nstart, or its kernel exited unexpectedly. A runtime that has\nended is removed rather than given a status.\n",
  identifier: "RuntimeStatus",
});

export const Runtime = Schema.Struct({
  id: RuntimeId,
  notebook_id: NotebookId,
  status: RuntimeStatus,
  message: Schema.Union([Schema.String, Schema.Null]).annotateKey({
    description:
      "A note about the current status, such as progress while `starting` or the reason when `failed`. Null otherwise.",
  }),
  marimo_version: Schema.Union([Schema.String, Schema.Null]).annotateKey({
    description:
      "The version of marimo running the kernel. Null until the host knows it.",
  }),
  started_at: Schema.String.annotateKey({
    description: "When this runtime started.",
    format: "date-time",
  }),
}).annotate({
  description:
    "A runtime is a kernel attached to one notebook, and a notebook has\nat most one. It ends when a client or the host stops it or its\nprocess exits, and the host then sends `runtime.removed`. Every start and restart creates\na new runtime with a new id. Results carry their producer's runtime\nid so clients can tell which are live.\n",
  identifier: "Runtime",
});

export const Attachment = Schema.Struct({
  id: AttachmentId,
  notebook_id: NotebookId,
  identity: Schema.Union([
    Schema.String.check(
      Schema.isMinCodePoints(1),
      Schema.isMaxCodePoints(128),
      Schema.isPattern(new RegExp("^[!-~]+$", "u")),
    ),
    Schema.Null,
  ]).annotateKey({
    description:
      "The opaque client identity supplied by `Marimo-Attachment-Identity`.\nNull when none was supplied. Consumers can group attachments\nwith the same identity within a host. It does not identify an\nindividual connection or change its lifetime.\n",
  }),
  kind: Schema.String.check(
    Schema.isPattern(new RegExp("^[a-z0-9-]+$", "u")),
  ).annotateKey({
    description:
      "What kind of thing is attached, supplied by `Marimo-Attachment-Kind`, such as `browser`, `editor`, or `agent`. Defaults to `client` when the header is omitted. Clients accept kinds they do not recognize.",
  }),
  name: Schema.Union([
    Schema.String.check(Schema.isMaxCodePoints(256)),
    Schema.Null,
  ]).annotateKey({
    description:
      "A label to show people, supplied by `Marimo-Attachment-Name`, such as the browser or editor's name. Null when the header is omitted or empty.",
  }),
  since: Schema.String.annotateKey({
    description: "When it attached.",
    format: "date-time",
  }),
}).annotate({
  description:
    "An attachment is a consumer connected to a notebook, such as a\nbrowser tab, an editor, or an agent. Opening the notebook's stream\ncreates one. It is removed when that connection closes, and not\nwhen the notebook's runtime stops or restarts. Each stream has its\nown attachment, even when several share a client identity.\n",
  identifier: "Attachment",
});
