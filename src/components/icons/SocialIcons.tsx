import type { ComponentType, JSX } from "react";
import { InstagramIcon, LinkedInIcon, XIcon, YouTubeIcon } from "@/components/icons/social";

interface SocialIcon {
    icon: JSX.Element;
    alt: string;
}

interface SocialIconComponentProps {
    iconColor?: string;
    borderColor?: string;
    iconSize?: string;
}

interface SocialIconDefinition {
    Component: ComponentType<SocialIconComponentProps>;
    alt: string;
}

const DEFAULT_ICON_COLOR = "fill-pure-white";
const DEFAULT_BORDER_COLOR = "fill-layout-bg/20";
const DEFAULT_ICON_SIZE = "size-15";

const SOCIAL_ICON_DEFINITIONS: SocialIconDefinition[] = [
    { Component: InstagramIcon, alt: "Instagram" },
    { Component: LinkedInIcon, alt: "LinkedIn" },
    { Component: XIcon, alt: "X (Twitter)" },
    { Component: YouTubeIcon, alt: "YouTube" },
];

export const getSocialIcons = (
    iconColor: string = DEFAULT_ICON_COLOR,
    borderColor: string = DEFAULT_BORDER_COLOR,
    iconSize: string = DEFAULT_ICON_SIZE
): SocialIcon[] =>
    SOCIAL_ICON_DEFINITIONS.map(({ Component, alt }) => ({
        icon: <Component iconColor={iconColor} borderColor={borderColor} iconSize={iconSize} />,
        alt,
    }));

export const socialIcons = getSocialIcons();
