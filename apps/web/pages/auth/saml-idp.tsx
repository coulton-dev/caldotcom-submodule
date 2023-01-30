import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

// To handle the IdP initiated login flow callback
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { code } = router.query;

    if (!code) {
      return;
    }

    signIn("saml-idp", {
      code,
    });
  }, []);

  return null;
}
