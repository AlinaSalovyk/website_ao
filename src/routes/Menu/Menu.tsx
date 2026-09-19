import * as Collapsible from "@radix-ui/react-collapsible";
import { XIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

interface MenuProps {
  onClose: () => void;
  locale?: Locale;
}

interface MenuSectionProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
  children: ReactNode;
}

const MenuSection = ({
  title,
  open,
  onOpenChange,
  contentClassName,
  children,
}: MenuSectionProps): JSX.Element => (
  <Collapsible.Root
    open={open}
    onOpenChange={onOpenChange}
    className="flex flex-col items-start w-full"
  >
    <div className="flex flex-col items-start gap-1 w-full">
      <Collapsible.Trigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 hover:bg-transparent justify-between gap-4 w-full whitespace-normal text-left cursor-pointer"
        >
          <span className="min-w-0 break-words text-pure-white text-2xl leading-8 font-normal">
            {title}
          </span>
          <div className="grid place-items-center w-5 h-5 shrink-0">
            <div className="w-5 h-[1px] bg-white transition-transform duration-300 [grid-area:1/1]" />
            <div
              className={cn(
                "w-5 h-[1px] bg-white transition-transform duration-300 [grid-area:1/1]",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
          </div>
        </Button>
      </Collapsible.Trigger>
      <Separator className="w-full h-px bg-menu-separator" />
    </div>

    <Collapsible.Content
      className={cn("flex flex-col items-start w-full", contentClassName)}
    >
      {children}
    </Collapsible.Content>
  </Collapsible.Root>
);

const MenuSubLink = ({
  href,
  label,
}: {
  href: string;
  label: string;
}): JSX.Element => (
  <a
    href={href}
    className="block w-full min-w-0 py-2 text-pure-white text-sm leading-6 font-normal break-words hover:opacity-80 transition-opacity"
  >
    {label}
  </a>
);

export const Menu = ({ onClose, locale = "uk" }: MenuProps): JSX.Element => {
  const t = getTranslations(locale);
  const lp = (path: string) => getLocalizedPath(path, locale);

  const educationalPrograms = [
    {
      title: t.educationLevels.bachelor,
      description: t.educationLevels.bachelorDesc,
      image: "/images/EducationalPrograms/BachelorsDegree.webp",
      anchor: "bachelor",
    },
    {
      title: t.educationLevels.master,
      description: t.educationLevels.masterDesc,
      image: "/images/EducationalPrograms/Magistracy.webp",
      anchor: "master",
    },
    {
      title: t.educationLevels.postgraduate,
      description: t.educationLevels.postgraduateDesc,
      image: "/images/EducationalPrograms/PostgraduateStudies.webp",
      anchor: "postgraduate",
    },
  ];

  const departmentLinks = [
    {
      label: t.departments.it,
      href: lp("/information-technologies-and-data-analytics"),
    },
    { label: t.departments.finance, href: lp("/finance-and-business") },
    { label: t.departments.management, href: lp("/management-and-marketing") },
    {
      label: t.departments.math,
      href: lp("/mathematics-and-intelligent-computing"),
    },
  ];

  const laboratoryLinks = [
    { label: t.laboratories.robotics, href: lp("/laboratory") },
    { label: t.laboratories.vr, href: lp("/laboratory-vr") },
  ];

  const simpleMenuItems = [
    { label: t.nav.home, href: lp("/") },
    { label: t.nav.aboutInstitute, href: lp("/institute") },
  ];

  const bottomSimpleMenuItems = [
    { label: t.nav.studentLife, href: lp("/institute") + "#student-life" },
    {
      label: t.nav.scientificActivity,
      href: lp("/institute") + "#scientific-activity",
    },
  ];

  const footerLinksLeft = [
    { label: t.nav.news, href: lp("/news") },
    { label: t.nav.leadership, href: lp("/") + "#leadership" },
    {
      label: t.nav.admission,
      href: "https://vstup.oa.edu.ua/",
      isExternal: true,
    },
    {
      label: t.nav.university,
      href: "https://www.oa.edu.ua/",
      isExternal: true,
    },
  ];

  const footerLinksRight = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/1HFdWWQbxD/",
      isExternal: true,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/itb_oa?igsh=MWp6aWxqc3VuMDA5Zw==",
      isExternal: true,
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@itb_oa?_r=1&_t=ZS-945ZKJPCHMV",
      isExternal: true,
    },
  ];
  const openerRef = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    onClose();
  };

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    return () => {
      if (openerRef.current && document.contains(openerRef.current)) {
        openerRef.current.focus();
      }
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !menuRef.current) return;
    const focusable = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    if (!menuRef.current.contains(document.activeElement)) {
      e.preventDefault();
      if (e.shiftKey) {
        focusable[focusable.length - 1].focus();
      } else {
        focusable[0].focus();
      }
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleFocusTrap);
    // Focus the close button on mount
    const closeBtn = menuRef.current?.querySelector<HTMLElement>("button");
    closeBtn?.focus();
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [handleFocusTrap]);

  const [isProgramsOpen, setIsProgramsOpen] = useState(true);
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
  const [isLaboratoriesOpen, setIsLaboratoriesOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[99] backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Menu Panel */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.menuAriaLabel}
        className="flex flex-col h-dvh items-start p-4 sm:p-6 bg-layout-bg border-r border-solid border-menu-border fixed left-0 top-0 bottom-0 z-[100] overflow-y-auto overflow-x-hidden w-full max-w-[480px] animate-slide-in-left"
      >
        <div className="inline-flex pb-4 flex-col items-start">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full border-pure-white bg-transparent hover:bg-pure-white/10 flex items-center justify-center"
            onClick={handleClose}
          >
            <XIcon className="w-4 h-4 text-pure-white" />
          </Button>
        </div>

        <div className="flex flex-col items-start justify-between flex-1 self-stretch w-full">
          <nav className="flex flex-col items-start self-stretch w-full">
            <div className="flex flex-col items-start justify-center gap-2.5 py-2 w-full">
              {simpleMenuItems.map((item) => (
                <div
                  key={item.href}
                  className="flex flex-col items-start gap-1 w-full"
                >
                  <a
                    href={item.href}
                    onClick={onClose}
                    className="block h-auto p-0 w-full min-w-0 break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-2xl leading-8 font-normal">
                      {item.label}
                    </span>
                  </a>
                  <Separator className="w-full h-px bg-menu-separator" />
                </div>
              ))}

              <MenuSection
                title={t.nav.educationalPrograms}
                open={isProgramsOpen}
                onOpenChange={setIsProgramsOpen}
              >
                {educationalPrograms.map((program) => (
                  <a
                    key={program.anchor}
                    href={`${lp("/")}#${program.anchor}`}
                    onClick={onClose}
                    className="h-auto w-full flex items-center gap-3 px-0 py-2 hover:bg-pure-white/5 justify-start cursor-pointer rounded-sm transition-colors"
                  >
                    <div className="flex flex-col w-10 h-10 items-start justify-center rounded overflow-hidden flex-shrink-0">
                      <div
                        className="w-10 h-10 bg-cover bg-center"
                        style={{ backgroundImage: `url(${program.image})` }}
                      />
                    </div>

                    <div className="flex min-w-0 flex-col items-start justify-center">
                      <span className="font-medium text-pure-white text-sm leading-[18px] break-words">
                        {program.title}
                      </span>
                      <span className="font-normal text-news-gray text-xs leading-[18.3px] break-words">
                        {program.description}
                      </span>
                    </div>
                  </a>
                ))}
              </MenuSection>

              <MenuSection
                title={t.nav.departments}
                open={isDepartmentsOpen}
                onOpenChange={setIsDepartmentsOpen}
                contentClassName="pl-4"
              >
                {departmentLinks.map((link) => (
                  <MenuSubLink key={link.href} {...link} />
                ))}
              </MenuSection>

              <MenuSection
                title={t.nav.laboratories}
                open={isLaboratoriesOpen}
                onOpenChange={setIsLaboratoriesOpen}
                contentClassName="pl-4"
              >
                {laboratoryLinks.map((link) => (
                  <MenuSubLink key={link.href} {...link} />
                ))}
              </MenuSection>

              {bottomSimpleMenuItems.map((item) => (
                <div
                  key={item.href}
                  className="flex flex-col items-start gap-1 w-full"
                >
                  <a
                    href={item.href}
                    onClick={onClose}
                    className="block h-auto p-0 w-full min-w-0 break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-2xl leading-8 font-normal">
                      {item.label}
                    </span>
                  </a>
                  <Separator className="w-full h-px bg-menu-separator" />
                </div>
              ))}
            </div>
          </nav>

          <footer className="flex min-h-[94.38px] justify-end mt-auto pt-6 flex-1 self-stretch w-full flex-col items-start">
            <div className="grid grid-cols-2 gap-2 self-stretch w-full">
              <div className="flex flex-col items-start gap-2">
                {footerLinksLeft.map((link) => (
                  <Button
                    key={`${link.label}-${link.href}`}
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start cursor-pointer"
                    asChild
                    onClick={onClose}
                  >
                    <a
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noopener noreferrer" : undefined}
                    >
                      <span className="font-normal text-news-gray text-sm leading-4">
                        {link.label}
                      </span>
                    </a>
                  </Button>
                ))}
              </div>

              <div className="flex flex-col items-start gap-2">
                {footerLinksRight.map((link) => (
                  <Button
                    key={`${link.label}-${link.href}`}
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start cursor-pointer"
                    asChild
                    onClick={onClose}
                  >
                    <a
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noopener noreferrer" : undefined}
                    >
                      <span className="font-normal text-news-gray text-sm leading-4">
                        {link.label}
                      </span>
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};
