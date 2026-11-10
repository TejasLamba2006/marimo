/* Copyright 2026 Marimo. All rights reserved. */

import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import * as Problems from "../Problems.ts";
import * as Host from "../Host.ts";

// @ts-expect-error A decision error must carry the questions to answer.
new Problems.DecisionRequired({});
// @ts-expect-error A failed precondition must carry the current document and cell.
new Problems.PreconditionFailed({});
// @ts-expect-error Unrelated errors cannot carry decision fields.
new Problems.NotFound({ decisions: [] });

export function checkNarrowing(error: typeof Problems.Problem.Type) {
  if (error._tag === "PreconditionFailed") {
    return error.document;
  }
  if (error._tag === "DecisionRequired") {
    return error.decisions;
  }
  if (error._tag === "NotFound") {
    // @ts-expect-error An unrelated error has no decisions field.
    return error.decisions;
  }
}

HttpApiBuilder.handler(Host.Api, "Notebook", "save", () =>
  Effect.fail(new Problems.DecisionRequired({ decisions: [] })),
);
HttpApiBuilder.handler(Host.Api, "Notebook", "save", () =>
  // @ts-expect-error Saving does not require a runtime.
  Effect.fail(new Problems.NoRuntime()),
);

const notFound = new Problems.NotFound();
const notFoundTag: "NotFound" = notFound._tag;
const recovered: Effect.Effect<string> = Effect.fail(notFound).pipe(
  Effect.catchTag(notFoundTag, (error) => Effect.succeed(error.title)),
);
Effect.fail(notFound).pipe(
  // @ts-expect-error Only declared error tags can be handled.
  Effect.catchTag("Unauthorized", () => Effect.succeed("wrong tag")),
);
// @ts-expect-error A known error cannot carry another problem's status.
new Problems.NotFound({ status: 409 });
new Problems.NotFound({
  // @ts-expect-error A known error cannot carry another problem's type.
  type: "urn:marimo:problem:conflict",
});
void recovered;
