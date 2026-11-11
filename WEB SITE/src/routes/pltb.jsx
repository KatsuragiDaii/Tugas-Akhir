import ContentPLTB from "~/partials/pltb";
import ContentLayout from "~/partials/layout/content.layout.jsx";

import { UseAuthCtx } from "~/context/auth.context";
import { useNavigate } from "@solidjs/router";

export default function PLTB() {

  const navigate = useNavigate();
  const { auth } = UseAuthCtx();

  return (
    <ContentLayout title={"PLTB"} bg="bg-sisgrid-bg">
      {auth() ? <ContentPLTB /> : navigate(import.meta.env.VITE_REDIRECT_TO_LOGIN)}
    </ContentLayout>
  );
}
