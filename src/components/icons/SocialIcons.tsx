import type { ComponentType, JSX } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/icons/social";

interface SocialIcon {
  icon: JSX.Element;
  alt: string;
}

export type SocialIconAlt =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

interface SocialIconComponentProps {
  iconColor?: string;
  borderColor?: string;
  iconSize?: string;
}

interface SocialIconDefinition {
  Component: ComponentType<SocialIconComponentProps>;
  alt: SocialIconAlt;
}

const DEFAULT_ICON_COLOR = "fill-pure-white";
const DEFAULT_BORDER_COLOR = "fill-layout-bg/20";
const DEFAULT_ICON_SIZE = "size-15";

const SOCIAL_ICON_DEFINITIONS: SocialIconDefinition[] = [
  { Component: InstagramIcon, alt: "Instagram" },
  { Component: FacebookIcon, alt: "Facebook" },
  { Component: LinkedInIcon, alt: "LinkedIn" },
  { Component: TikTokIcon, alt: "TikTok" },
  { Component: YouTubeIcon, alt: "YouTube" },
];

export const getSocialIcons = (
  iconColor: string = DEFAULT_ICON_COLOR,
  borderColor: string = DEFAULT_BORDER_COLOR,
  iconSize: string = DEFAULT_ICON_SIZE,
  visibleAlts?: SocialIconAlt[],
): SocialIcon[] =>
  SOCIAL_ICON_DEFINITIONS.filter(
    ({ alt }) => !visibleAlts || visibleAlts.includes(alt),
  ).map(({ Component, alt }) => ({
    icon: (
      <Component
        iconColor={iconColor}
        borderColor={borderColor}
        iconSize={iconSize}
      />
    ),
    alt,
  }));

export const socialIcons = getSocialIcons();
