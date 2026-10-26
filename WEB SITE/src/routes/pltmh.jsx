import ContentPLTMH from "~/partials/pltmh";
import ContentLayout from "~/partials/layout/content.layout.jsx";

import { UseAuthCtx } from "~/context/auth.context";
import { useNavigate } from "@solidjs/router";

export default function PLTMH() {

  const navigate = useNavigate();
  const { auth } = UseAuthCtx();

  return (
    <ContentLayout title={"PLTMH"} bg="bg-sisgrid-bg">
      {auth() ? <ContentPLTMH /> : navigate(import.meta.env.VITE_REDIRECT_TO_LOGIN)}
    </ContentLayout>
  );
}
