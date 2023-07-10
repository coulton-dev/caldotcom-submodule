import type { ResetPasswordRequest } from "@prisma/client";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken } from "next-auth/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import type { CSSProperties } from "react";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";

import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import prisma from "@calcom/prisma";
import { Button, PasswordField, Form } from "@calcom/ui";

import PageWrapper from "@components/PageWrapper";
import AuthContainer from "@components/ui/AuthContainer";

type Props = {
  id: string;
  resetPasswordRequest: ResetPasswordRequest;
  csrfToken: string;
};

export default function Page({ resetPasswordRequest, csrfToken }: Props) {
  const { t } = useLocale();
  const submitChangePassword = async ({ password, requestId }: { password: string; requestId: string }) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ requestId, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await res.json();
    if (!res.ok) return formMethods.setError("new_password", { type: "server", message: json.message });
  };

  const Success = () => {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h2 className="font-cal text-emphasis mt-6 text-center text-3xl font-extrabold">
              {t("password_updated")}
            </h2>
          </div>
          <Button href="/auth/login" className="w-full justify-center">
            {t("login")}
          </Button>
        </div>
      </>
    );
  };

  const Expired = () => {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h2 className="font-cal text-emphasis mt-6 text-center text-3xl font-extrabold">{t("whoops")}</h2>
            <h2 className="text-emphasis text-center text-3xl font-extrabold">{t("request_is_expired")}</h2>
          </div>
          <p>{t("request_is_expired_instructions")}</p>
          <Link href="/auth/forgot-password" passHref legacyBehavior>
            <button
              type="button"
              className="flex w-full justify-center px-4 py-2 text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
              {t("try_again")}
            </button>
          </Link>
        </div>
      </>
    );
  };

  const isRequestExpired = useMemo(() => {
    const now = dayjs();
    return dayjs(resetPasswordRequest.expires).isBefore(now);
  }, [resetPasswordRequest]);

  const formMethods = useForm<{ new_password: string }>();
  const success = formMethods.formState.isSubmitSuccessful;
  const loading = formMethods.formState.isSubmitting;

  return (
    <AuthContainer
      showLogo
      title={t("reset_password")}
      description={t("change_your_password")}
      heading={!success ? t("reset_password") : undefined}>
      {isRequestExpired && <Expired />}
      {!isRequestExpired && !success && (
        <>
          <Form
            className="space-y-6"
            form={formMethods}
            style={
              {
                "--cal-brand": "#111827",
                "--cal-brand-emphasis": "#101010",
                "--cal-brand-text": "white",
                "--cal-brand-subtle": "#9CA3AF",
              } as CSSProperties
            }
            handleSubmit={async (values) => {
              await submitChangePassword({
                password: values.new_password,
                requestId: resetPasswordRequest.id,
              });
            }}>
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} hidden />
            <div className="mt-1">
              <PasswordField
                {...formMethods.register("new_password", {
                  minLength: {
                    message: t("password_hint_min"),
                    value: 7, // We don't have user here so we can't check if they are admin or not
                  },
                  pattern: {
                    message: "Should contain a number, uppercase and lowercase letters",
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/gm,
                  },
                })}
                label={t("new_password")}
              />
            </div>

            <div>
              <Button
                loading={loading}
                color="primary"
                type="submit"
                disabled={loading}
                className="w-full justify-center">
                {t("reset_password")}
              </Button>
            </div>
          </Form>
        </>
      )}
      {!isRequestExpired && success && (
        <>
          <Success />
        </>
      )}
    </AuthContainer>
  );
}

Page.isThemeSupported = false;
Page.PageWrapper = PageWrapper;
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = context.params?.id as string;

  try {
    const resetPasswordRequest = await prisma.resetPasswordRequest.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        expires: true,
      },
    });

    return {
      props: {
        resetPasswordRequest: {
          ...resetPasswordRequest,
          expires: resetPasswordRequest.expires.toString(),
        },
        id,
        csrfToken: await getCsrfToken({ req: context.req }),
        ...(await serverSideTranslations(context.locale || "en", ["common"])),
      },
    };
  } catch (reason) {
    return {
      notFound: true,
    };
  }
}
