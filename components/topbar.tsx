import Controllers from "./controllers";
import Logo from "./logo";
import Settings from "./settings";

export default function Topbar() {
    return (
        <>
            <Logo />
            <Controllers />
            <Settings />
        </>
    );
}