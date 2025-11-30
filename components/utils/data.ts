import { HotspotId } from "./SceneContext";

export const links: Record<HotspotId | "allProjects", { project: string, github?: string } | { project: string, github?: string }[]> = {
    phone: { project: "https://portfolio.ahmedmahmoud.de/en#contact" },
    pc: { project: "https://portfolio.ahmedmahmoud.de/en#about" },
    ps5: { project: "https://helloxr.ahmedmahmoud.de" },
    portrait: [
        {
            project: "https://portfolio.ahmedmahmoud.de",
            github: "https://github.com/dev-ahmedmahmoud/3D-Portfolio"
        },
        {
            project: "https://iphone15replica.ahmedmahmoud.de",
            github: "https://github.com/dev-ahmedmahmoud/iphone-15-replica"
        },
        {
            project: "https://productmodeling.ahmedmahmoud.de",
            github: "https://github.com/dev-ahmedmahmoud/product-modeling"
        }
    ],
    allProjects: [
        {
            project: "https://portfolio.ahmedmahmoud.de/en#projects",
        }
    ],
}