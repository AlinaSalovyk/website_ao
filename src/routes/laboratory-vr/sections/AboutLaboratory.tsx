import { type JSX } from "react";

export const AboutLaboratory = (): JSX.Element => {
  return (
    <section className="w-full bg-pure-white text-pure-black pt-20 pb-10 2xl:pt-24 2xl:pb-12">
      <div className="container mx-auto px-4 md:px-9 flex flex-col">
        {/* Header */}
        <div className="flex justify-end mb-16 md:mb-24 border-b border-pure-black pb-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold">
            Про лабораторію
          </h2>
        </div>

        {/* Content Block 1: Mission & Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">Можливості</h3>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base md:text-lg leading-relaxed">
              Лабораторія відповідає на потребу у створенні прикладних цифрових
              рішень для бізнесу, університетів і державних структур з
              урахуванням їхніх специфічних задач та контексту використання.
              Поєднуючи дослідницький підхід із практичною розробкою, ми
              формуємо проєкти, здатні залучати фінансування в межах
              національних і міжнародних грантових програм, а також створюємо
              середовище, де студенти навчаються на реальних комерційних кейсах,
              здобуваючи актуальний професійний досвід.
            </p>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/BachelorsDegree.webp"
                alt="VR моделювання"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* Content Block 2: Infrastructure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">Типові продукти</h3>
          </div>
          <div className="lg:col-span-5">
            <ul className="list-disc pl-5 space-y-6 text-base md:text-lg leading-relaxed">
              <li>
                <strong>Архітектурна візуалізація та цифрові двійники</strong>
                <br /> Інтер’єри й екстер’єри будівель, міські простори та
                великі відкриті локації з інтерактивними елементами.
              </li>
              <li>
                <strong>Історія та туризм</strong>
                <br /> VR-експозиції, віртуальні музеї та інтерактивні шоуруми
                для культурних і туристичних проєктів.
              </li>
              <li>
                <strong>Освітні рішення</strong>
                <br /> Навчальні курси, симулятори та інтерактивні середовища
                для освіти й професійної підготовки.
              </li>
              <li>
                <strong>Ігрові та VR-проєкти</strong>
                <br /> Прості ігрові рішення та VR-додатки для демонстрацій,
                навчання або комерційного використання.
              </li>
            </ul>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/Magistracy.webp"
                alt="Інфраструктура лабораторії"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* Content Block 3: Research Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16 md:pb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">
              Напрямки досліджень
            </h3>
          </div>
          <div className="lg:col-span-5">
            <ul className="list-disc pl-5 space-y-2 text-base md:text-lg leading-relaxed">
              <li>
                Розробка імерсивних навчальних VR/AR-середовищ для освітніх
                програм.
              </li>
              <li>
                Створення цифрових двійників для промислових об'єктів та
                інфраструктури.
              </li>
              <li>
                Комп'ютерне моделювання та симуляція складних фізичних процесів.
              </li>
              <li>
                Візуалізація великих масивів даних та наукових результатів.
              </li>
              <li>
                Розробка інтерактивних 3D-моделей для музеїв, архітектури та
                культурної спадщини.
              </li>
            </ul>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/PostgraduateStudies.webp"
                alt="Дослідницькі проєкти"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
