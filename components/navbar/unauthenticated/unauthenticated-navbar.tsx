import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"

import Image from "next/image";
import Link from "next/link";


export default function UnauthenticatedNavbar() {

    return (
            <NavigationMenu className={"text-white w-full"}>
                <Image src={`/logo/nocking.png`} alt={"Nock.ing Logo"} width={196} height={64} />
                <NavigationMenuList className="flex space-x-12 justify-between">
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href="/" className="font-medium">
                                Community
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href="/" className="font-medium">
                                Sponsor Us
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href="/" className="font-medium">
                                Pricing
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href="/" className="font-medium">
                                Contact
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
    )
}