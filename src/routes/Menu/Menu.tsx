import { XIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SOCIAL_URLS } from "@/lib/social-links";
import { Button } from "@/components/ui/button";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const educationalPrograms = [
  {
    title: "Бакалаврат",
    description: "І рівень вищої освіти",
    image: "/images/EducationalPrograms/BachelorsDegree.png",
  },
  {
    title: "Магістратура",
    description: "ІІ рівень вищої освіти",
    image: "/images/EducationalPrograms/Magistracy.png",
  },
  {
    title: "Аспірантура",
    description: "ІІІ освітньо-науковий рівень",
    image: "/images/EducationalPrograms/PostgraduateStudies.png",
  },
];

const simpleMenuItems = [
  { label: "Головна", href: "/" },
  { label: "Про інститут", href: "/institute" },
];

const bottomSimpleMenuItems = [
  { label: "Студенське життя", href: "/institute#student-life" },
  { label: "Наукова діяльність", href: "/institute#scientific-activity" },
];

const footerLinksLeft = [
  { label: "Керівництво", href: "/#leadership" },
  { label: "Вступ", href: "https://vstup.oa.edu.ua/", isExternal: true },
  { label: "НаУОА", href: "https://www.oa.edu.ua/", isExternal: true },
];

const footerLinksRight = [
  { label: "Facebook", href: SOCIAL_URLS.facebook, isExternal: true },
  { label: "Instagram", href: SOCIAL_URLS.instagram, isExternal: true },
  { label: "TikTok", href: SOCIAL_URLS.tiktok, isExternal: true },
];

interface MenuProps {
  onClose: () => void;
}

export const Menu = ({ onClose }: MenuProps): JSX.Element => {
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
        aria-label="Навігаційне меню"
        className="flex flex-col h-screen items-start p-6 bg-layout-bg border-r border-solid border-menu-border fixed left-0 top-0 bottom-0 z-[100] overflow-y-auto w-full max-w-[480px] animate-slide-in-left"
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
            <div className="flex flex-col max-w-[470.67px] items-start justify-center gap-2.5 py-2 w-full">
              {simpleMenuItems.map((item) => (
                <div
                  key={item.href}
                  className="inline-flex flex-col items-start gap-1 w-full"
                >
                  <a
                    href={item.href}
                    onClick={onClose}
                    className="h-auto p-0 justify-start w-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-2xl leading-8 font-normal">
                      {item.label}
                    </span>
                  </a>
                  <Separator className="w-full h-px bg-[#ffffff33]" />
                </div>
              ))}

              <Collapsible.Root
                open={isProgramsOpen}
                onOpenChange={setIsProgramsOpen}
                className="flex flex-col items-start w-full"
              >
                <div className="inline-flex flex-col items-start gap-1 w-full">
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                    >
                      <span className="text-pure-white text-2xl leading-8 font-normal">
                        Освітні програми
                      </span>
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                        <div
                          className={cn(
                            "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                            isProgramsOpen ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </div>
                    </Button>
                  </Collapsible.Trigger>
                  <Separator className="w-full h-px bg-[#ffffff33]" />
                </div>

                <Collapsible.Content className="flex flex-col items-start w-full">
                  <div className="flex flex-col items-start w-full">
                    {educationalPrograms.map((program) => (
                      <a
                        key={program.title}
                        href={`/#${program.title === "Бакалаврат" ? "bachelor" : program.title === "Магістратура" ? "master" : "postgraduate"}`}
                        onClick={onClose}
                        className="h-auto max-w-[470.67px] w-full flex items-center gap-3 px-0 py-2 hover:bg-pure-white/5 justify-start cursor-pointer rounded-sm transition-colors"
                      >
                        <div className="flex flex-col w-10 h-10 items-start justify-center rounded overflow-hidden flex-shrink-0">
                          <div
                            className="w-10 h-10 bg-cover bg-center"
                            style={{ backgroundImage: `url(${program.image})` }}
                          />
                        </div>

                        <div className="inline-flex flex-col items-start justify-center">
                          <div className="inline-flex flex-col items-start">
                            <span className="font-medium text-pure-white text-sm leading-[18px]">
                              {program.title}
                            </span>
                          </div>

                          <div className="inline-flex flex-col items-start">
                            <span className="font-normal text-news-gray text-xs leading-[18.3px]">
                              {program.description}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>

              <Collapsible.Root
                open={isDepartmentsOpen}
                onOpenChange={setIsDepartmentsOpen}
                className="flex flex-col items-start w-full"
              >
                <div className="inline-flex flex-col items-start gap-1 w-full">
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                    >
                      <span className="text-pure-white text-2xl leading-8 font-normal">
                        Кафедри інституту
                      </span>
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                        <div
                          className={cn(
                            "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                            isDepartmentsOpen ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </div>
                    </Button>
                  </Collapsible.Trigger>
                  <Separator className="w-full h-px bg-[#ffffff33]" />
                </div>
                <Collapsible.Content className="flex flex-col items-start w-full pl-4">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/information-technologies-and-data-analytics"
                      className="text-pure-white text-lg leading-6 font-normal"
                    >
                      Кафедра інформаційних технологій та аналітики даних
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/finance-and-business"
                      className="text-pure-white text-lg leading-6 font-normal"
                    >
                      Кафедра фінансів та бізнесу
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/management-and-marketing"
                      className="text-pure-white text-lg leading-6 font-normal"
                    >
                      Кафедра менеджменту та маркетингу
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/mathematics-and-intelligent-computing"
                      className="text-pure-white text-lg leading-6 font-normal"
                    >
                      Кафедра математики та інтелектуальних обчислень
                    </a>
                  </Button>
                </Collapsible.Content>
              </Collapsible.Root>

              <Collapsible.Root
                open={isLaboratoriesOpen}
                onOpenChange={setIsLaboratoriesOpen}
                className="flex flex-col items-start w-full"
              >
                <div className="inline-flex flex-col items-start gap-1 w-full">
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                    >
                      <span className="text-pure-white text-2xl leading-8 font-normal">
                        Лабораторії інституту
                      </span>
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                        <div
                          className={cn(
                            "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                            isLaboratoriesOpen ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </div>
                    </Button>
                  </Collapsible.Trigger>
                  <Separator className="w-full h-px bg-[#ffffff33]" />
                </div>
                <Collapsible.Content className="flex flex-col items-start w-full pl-4">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/laboratory"
                      className="text-pure-white text-lg leading-6 font-normal"
                    >
                      Лабораторія робототехніки та вбудованих систем
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 px-1 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                    asChild
                  >
                    <a
                      href="/laboratory-vr"
                      className="block w-full min-w-0 text-pure-white text-lg leading-6 font-normal !whitespace-normal break-words text-left"
                    >
                      Лабораторія інноваційних систем моделювання, симуляції та
                      цифрової візуалізації
                    </a>
                  </Button>
                </Collapsible.Content>
              </Collapsible.Root>

              {bottomSimpleMenuItems.map((item) => (
                <div
                  key={item.href}
                  className="inline-flex flex-col items-start gap-1 w-full"
                >
                  <a
                    href={item.href}
                    onClick={onClose}
                    className="h-auto p-0 justify-start w-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-2xl leading-8 font-normal">
                      {item.label}
                    </span>
                  </a>
                  <Separator className="w-full h-px bg-[#ffffff33]" />
                </div>
              ))}
            </div>
          </nav>

          <footer className="flex min-h-[94.38px] justify-end pt-[178.67px] flex-1 self-stretch w-full flex-col items-start">
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
