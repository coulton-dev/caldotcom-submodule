import type { OnCheckErrorType } from "hooks/useGcal";
import { useState, useEffect } from "react";

import type { ApiErrorResponse } from "@calcom/platform-types";

import http from "../lib/http";

export interface useOffice365CalendarProps {
  isAuth: boolean;
  onCheckError?: OnCheckErrorType;
}

export const useOffice365Calendar = ({ isAuth, onCheckError }: useOffice365CalendarProps) => {
  const [allowConnect, setAllowConnect] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const redirectToOffice365OAuth = () => {
    http
      ?.get("/calendars/office365/connect")
      .then(({ data: responseBody }) => {
        if (responseBody.data?.authUrl) {
          window.location.href = responseBody.data.authUrl;
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isAuth) {
      http
        ?.get("/calendars/office365/check")
        .then(() => setAllowConnect(false))
        .catch((err) => {
          setAllowConnect(true);
          onCheckError?.(err as ApiErrorResponse);
        })
        .finally(() => setChecked(true));
    }
  }, [isAuth]);

  return { allowConnect, checked, redirectToOffice365OAuth };
};