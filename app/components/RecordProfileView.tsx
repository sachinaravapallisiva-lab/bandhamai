"use client";

import { useEffect, useRef } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import { PROFILE_VIEWS_PATH, shouldRecordProfileView } from "../../lib/profile-views";

/** Writes a view only when a signed-in member opens a real profile card. */
export default function RecordProfileView({
  profileId,
  signedIn,
  preview = false,
  onRecorded,
}: {
  profileId: string;
  signedIn: boolean;
  preview?: boolean;
  onRecorded?: (profileId: string) => void;
}) {
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  useEffect(
    function () {
      if (
        !shouldRecordProfileView({
          signedIn,
          preview,
          profileId,
        })
      ) {
        return;
      }

      let cancelled = false;
      authJsonHeaders()
        .then(function (headers) {
          if (!headers || cancelled) return null;
          return fetch(PROFILE_VIEWS_PATH, {
            method: "POST",
            headers,
            body: JSON.stringify({ profile_id: profileId }),
          });
        })
        .then(function (res) {
          if (!res || cancelled || !res.ok) return;
          const notify = onRecordedRef.current;
          if (notify) notify(profileId);
        })
        .catch(function () {
          /* Browse stays usable if views storage is not applied yet */
        });

      return function () {
        cancelled = true;
      };
    },
    [profileId, signedIn, preview]
  );

  return null;
}
