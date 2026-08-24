import { Show } from "solid-js";
import Preload from "~/components/Preload";
import { UseAuthCtx } from "~/context/auth.context";
import PageTitle from "~/components/title";

export default function ContentLayout(props) {

    const { auth } = UseAuthCtx();

    return (
        <div class="min-h-screen w-full px-4 py-2 bg-gray-100">
            <Show when={auth() && auth().username} fallback={<Preload />}>
                <PageTitle title={props.title} />
                <div class={`flex flex-col w-full animate-in fade-in duration-700`}>
                    {props.children}
                </div>
            </Show>
        </div>
    )
}