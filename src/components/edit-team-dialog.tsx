"use client";

import { useState } from "react";

import { TeamDraftRow } from "@/components/team-editor";
import { Button, Dialog, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/client";
import { teamNameSchema, type PublicState, type PublicTeam, type TeamDraft } from "@/lib/types";

/** Rename or restyle a team mid-season. Scores are untouched. */
export function EditTeamDialog(props: {
  team: PublicTeam | null;
  onClose: () => void;
  onApplied: (state: PublicState) => void;
}) {
  if (!props.team) return null;
  // Remount per team rather than syncing the draft from props.
  return <EditTeamForm key={props.team.id} {...props} team={props.team} />;
}

function EditTeamForm({
  team,
  onClose,
  onApplied,
}: {
  team: PublicTeam;
  onClose: () => void;
  onApplied: (state: PublicState) => void;
}) {
  const { push } = useToast();
  const [draft, setDraft] = useState<TeamDraft>({
    name: team.name,
    logo: team.logo,
    color: team.color,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameCheck = teamNameSchema.safeParse(draft.name);
  const localError = nameCheck.success
    ? null
    : (nameCheck.error.issues[0]?.message ?? "That name won't work");
  const dirty =
    draft.name.trim() !== team.name || draft.logo !== team.logo || draft.color !== team.color;

  const save = async () => {
    if (!nameCheck.success || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.updateTeam(team.id, draft.name.trim(), draft.logo, draft.color);
      onApplied(result.state);
      push({ tone: "success", title: "Team updated", detail: draft.name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Edit team"
      description="Change the name, crest or colour. Points stay exactly as they are."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            loading={busy}
            disabled={!dirty || Boolean(localError)}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TeamDraftRow
          index={0}
          draft={draft}
          onChange={setDraft}
          error={localError ?? error}
          autoFocus
        />
        <p className="text-[13px] text-ink-faint">
          A rename is recorded in the point log so the history still makes sense afterwards.
        </p>
      </div>
    </Dialog>
  );
}
