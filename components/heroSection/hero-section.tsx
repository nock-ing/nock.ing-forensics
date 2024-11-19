import UnauthenticatedNavbar from "@/components/navbar/unauthenticated/unauthenticated-navbar";
import Image from "next/image";

import { Button } from "@/components/ui/button"
import Link from "next/link";



export default function HeroSection() {

    return (
        <div className={"flex"}>
            <div className={"w-1/2 text-white space-x-10"}>
                <UnauthenticatedNavbar/>

                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Unveil Bitcoin Secrets.
                </h1>

                <p className="leading-7 [&:not(:first-child)]:mt-6">
                    The king, seeing how much happier his subjects were, realized the error of
                    his ways and repealed the joke tax.
                </p>


                {/* Login */}
                <div className={"mt-20"}>
                    <Link href={"/auth/login"}><Button>Login</Button></Link>
                </div>


            </div>
            <div className={"w-1/2 h-screen"}>
                <Image className={"w-full h-screen"} src={"/hero-images/borpa-spin-borpa.gif"} alt={"xdd"} width={64} height={64}/>
            </div>
        </div>
    )
}