import type { LocationKey } from "@/lib/services-data"

export type LocalizedLocationContent = {
  intro: string
  whoWeServe: readonly string[]
  faqs: readonly { q: string; a: string }[]
  metaTitle?: string
}

export const locationsEs: Record<LocationKey, LocalizedLocationContent> = {
  "hudson-county-nj": {
    intro: `Rootline Landscaping atiende con orgullo el condado de Hudson, NJ, con servicios profesionales de cuidado de césped y mantenimiento de propiedad. Desde las comunidades frente al río Hudson hasta los barrios residenciales de todo el condado, ofrecemos corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve con total confiabilidad. Nuestro equipo conoce las necesidades particulares de las propiedades del condado de Hudson, desde patios urbanos compactos hasta céspedes residenciales más amplios. Trabajamos con propietarios de vivienda, arrendadores y dueños de pequeñas propiedades comerciales que necesitan un cuidado de césped profesional y constante.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Pequeñas propiedades comerciales",
      "Propiedades de alquiler",
      "Asociaciones de townhomes",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en el condado de Hudson, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales en todo el condado de Hudson, incluyendo Union City, Jersey City, Hoboken y zonas cercanas.",
      },
      {
        q: "¿Realizan limpieza de hojas en el condado de Hudson?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño para propiedades residenciales y pequeños comercios en el condado de Hudson.",
      },
      {
        q: "¿Ofrecen remoción de nieve en el condado de Hudson?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para entradas, aceras y lotes comerciales pequeños en todo el condado de Hudson.",
      },
      {
        q: "¿Puedo solicitar cuidado de césped semanal o quincenal en el condado de Hudson?",
        a: "Por supuesto. Ofrecemos opciones flexibles de programación, incluyendo servicio semanal y quincenal de cuidado de césped en todo el condado de Hudson.",
      },
    ],
  },
  "union-city-nj": {
    metaTitle: "Cuidado de césped y mantenimiento de propiedad en Union City, NJ",
    intro: `Rootline Landscaping tiene su base en Union City, NJ, y nos enorgullece atender a nuestra comunidad local con cuidado de césped y mantenimiento de propiedad profesionales. Union City es una de las ciudades más densamente pobladas de Estados Unidos, y entendemos los retos únicos de mantener propiedades aquí. Nuestro equipo se especializa en lotes residenciales compactos, propiedades multifamiliares y los patios de acceso reducido tan comunes en Union City. Ya sea que tengas una vivienda unifamiliar, administres propiedades de alquiler o necesites mantenimiento para un lote comercial pequeño, ofrecemos corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve con total confiabilidad. Conocemos Union City porque vivimos y trabajamos aquí.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propietarios de propiedades multifamiliares",
      "Administradores de propiedades de alquiler",
      "Pequeñas propiedades comerciales",
      "Patios pequeños y lotes compactos",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Union City, NJ?",
        a: "Sí, tenemos base en Union City y ofrecemos corte de césped, recorte, bordeado y soplado profesionales para propiedades residenciales y pequeños comercios.",
      },
      {
        q: "¿Trabajan con patios pequeños en Union City?",
        a: "Por supuesto. Nos especializamos en los patios compactos y propiedades de acceso reducido tan comunes en Union City. Ningún patio es demasiado pequeño para un cuidado profesional.",
      },
      {
        q: "¿Realizan limpieza de hojas en Union City?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño en Union City, incluyendo limpieza de jardineras y disposición de escombros.",
      },
      {
        q: "¿Atienden propiedades de alquiler en Union City?",
        a: "Sí, trabajamos con muchos arrendadores y administradores de propiedades en Union City que necesitan cuidado de césped y mantenimiento confiable para sus inmuebles de alquiler.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Union City?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en Union City, incluyendo entradas, aceras y lotes pequeños.",
      },
    ],
  },
  "jersey-city-nj": {
    metaTitle: "Cuidado de césped y mantenimiento de propiedad en Jersey City, NJ",
    intro: `Rootline Landscaping atiende Jersey City, NJ, con cuidado de césped y mantenimiento de propiedad diseñados para la diversidad de inmuebles que hay en la ciudad. Desde los brownstones y townhomes de the Heights hasta los barrios residenciales de Greenville y Bergen-Lafayette, entendemos las propiedades de Jersey City. Nuestros servicios incluyen corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve. Trabajamos con propietarios de vivienda, arrendadores que gestionan alquileres, dueños de propiedades multifamiliares y lotes comerciales pequeños. Los patios de Jersey City suelen exigir atención al acceso trasero, al estacionamiento y a un servicio eficiente, y eso es exactamente lo que ofrecemos.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propietarios de propiedades multifamiliares",
      "Administradores de propiedades de alquiler",
      "Pequeñas propiedades comerciales",
      "Propiedades solo con patio trasero",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Jersey City, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales en Jersey City, incluyendo the Heights, Greenville y la zona de Journal Square.",
      },
      {
        q: "¿Atienden propiedades multifamiliares en Jersey City?",
        a: "Sí, trabajamos con muchos propietarios multifamiliares y arrendadores en Jersey City que necesitan cuidado de césped y mantenimiento constantes y confiables.",
      },
      {
        q: "¿Realizan limpieza de patio trasero en Jersey City?",
        a: "Sí, atendemos propiedades solo con patio trasero y entendemos los retos de acceso comunes en Jersey City. Podemos trabajar con situaciones de acceso limitado.",
      },
      {
        q: "¿Ofrecen servicio recurrente de césped en Jersey City?",
        a: "Sí, ofrecemos cuidado de césped recurrente semanal y quincenal en Jersey City para un mantenimiento constante y confiable.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Jersey City?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en Jersey City.",
      },
    ],
  },
  "hoboken-nj": {
    metaTitle: "Cuidado de césped para patios pequeños y townhomes en Hoboken, NJ",
    intro: `Rootline Landscaping ofrece cuidado de césped y mantenimiento de propiedad profesionales en Hoboken, NJ. Hoboken es conocida por sus brownstones, townhomes y propiedades residenciales compactas con patios pequeños y espacio exterior limitado. Nos especializamos precisamente en este tipo de inmuebles. Nuestro equipo brinda corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve pensados para la vida en Hoboken. Entendemos la importancia de una buena presentación exterior en una ciudad peatonal como Hoboken, y trabajamos con eficiencia en las zonas de acceso reducido tan comunes en toda la ciudad. Ya sea que tengas un patio delantero pequeño, un área de patio trasero o un espacio en azotea que necesite mantenimiento, podemos ayudarte.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Propietarios de townhomes",
      "Propietarios de brownstones",
      "Arrendadores",
      "Propiedades de alquiler",
      "Especialistas en patios pequeños",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Hoboken, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales en Hoboken, incluyendo patios pequeños y propiedades residenciales compactas.",
      },
      {
        q: "¿Trabajan con patios pequeños y townhomes en Hoboken?",
        a: "Por supuesto. Nos especializamos en los patios pequeños, jardines de brownstone y espacios exteriores compactos tan comunes en Hoboken.",
      },
      {
        q: "¿Realizan limpieza de hojas en Hoboken?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño en Hoboken, incluyendo patios delanteros, traseros y zonas de acceso reducido.",
      },
      {
        q: "¿Atienden propiedades de alquiler en Hoboken?",
        a: "Sí, trabajamos con arrendadores y administradores de propiedades en Hoboken que necesitan cuidado de césped confiable y buena presentación exterior para sus inmuebles de alquiler.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Hoboken?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en Hoboken, incluyendo aceras, escalones y lotes pequeños.",
      },
    ],
  },
  "north-bergen-nj": {
    metaTitle: "Cuidado de césped y mantenimiento de patio en North Bergen, NJ",
    intro: `Rootline Landscaping atiende North Bergen, NJ, con servicios profesionales de cuidado de césped y mantenimiento de propiedad. North Bergen combina viviendas unifamiliares, propiedades multifamiliares y lotes comerciales pequeños, y atendemos todos ellos. Nuestro equipo ofrece corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve con un horario confiable. Ya vivas a lo largo de Boulevard East con vistas al skyline de Manhattan o en los barrios residenciales del municipio, brindamos un cuidado de césped constante y profesional. Trabajamos con propietarios de vivienda, arrendadores y administradores de propiedades que valoran un trabajo limpio y un servicio en el que pueden confiar.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propiedades multifamiliares",
      "Administradores de propiedades de alquiler",
      "Pequeñas propiedades comerciales",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en North Bergen, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales en todo el municipio de North Bergen.",
      },
      {
        q: "¿Realizan limpieza de hojas en North Bergen?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño para propiedades residenciales y comerciales en North Bergen.",
      },
      {
        q: "¿Ofrecen cuidado de césped semanal en North Bergen?",
        a: "Sí, ofrecemos servicio semanal y quincenal de cuidado de césped con programación confiable en todo North Bergen.",
      },
      {
        q: "¿Ofrecen remoción de nieve en North Bergen?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en North Bergen.",
      },
    ],
  },
  "west-new-york-nj": {
    metaTitle: "Cuidado de césped para patios pequeños en West New York, NJ",
    intro: `Rootline Landscaping ofrece cuidado de césped y mantenimiento de propiedad en West New York, NJ. Como uno de los municipios más densamente poblados de Nueva Jersey, las propiedades de West New York requieren un proveedor que entienda espacios compactos y un servicio eficiente. Nos especializamos en los lotes residenciales, propiedades multifamiliares y patios pequeños que hay en toda la ciudad. Nuestros servicios incluyen corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve. Ofrecemos una programación confiable para que siempre sepas cuándo llegaremos, y dejamos cada propiedad con un aspecto limpio y profesional.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propiedades multifamiliares",
      "Patios pequeños",
      "Administradores de propiedades de alquiler",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en West New York, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales en West New York para propiedades residenciales y multifamiliares.",
      },
      {
        q: "¿Trabajan con patios pequeños en West New York?",
        a: "Sí, nos especializamos en los patios compactos y las propiedades residenciales densas tan comunes en West New York.",
      },
      {
        q: "¿Realizan limpieza de hojas en West New York?",
        a: "Sí, ofrecemos limpieza y retiro de hojas en otoño para propiedades en West New York.",
      },
      {
        q: "¿Ofrecen remoción de nieve en West New York?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en West New York.",
      },
    ],
  },
  "weehawken-nj": {
    metaTitle: "Cuidado de césped para patios pequeños en Weehawken, NJ",
    intro: `Rootline Landscaping atiende Weehawken, NJ, con cuidado de césped y mantenimiento de propiedad diseñados para las propiedades residenciales compactas y las viviendas en ladera que definen esta comunidad del condado de Hudson. Weehawken es conocida por sus impresionantes vistas al skyline de Manhattan, sus calles bien cuidadas y sus altos valores de propiedad, lo que significa que la presentación exterior importa aquí más que en casi cualquier otro lugar de Nueva Jersey.

Nuestro equipo se especializa en los patios más pequeños, las zonas de acceso reducido y las propiedades en pendiente tan comunes en Weehawken. Ofrecemos corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve con un horario confiable. Ya sea que tengas un townhome cerca del waterfront, una vivienda unifamiliar a lo largo de Boulevard East o una propiedad en los barrios de la ladera, entregamos resultados limpios y profesionales en cada visita.

Los propietarios de Weehawken valoran nuestra atención al detalle. Entendemos que la presentación exterior es importante en una comunidad donde los vecinos se enorgullecen de sus propiedades. Nuestro equipo llega a tiempo, completa el trabajo con eficiencia y deja tu propiedad impecable. Ofrecemos opciones de cuidado de césped semanal y quincenal para que elijas la frecuencia que mejor se adapte a tu césped y presupuesto.

Para servicios estacionales, realizamos limpiezas completas de primavera y otoño para preparar tu propiedad ante el cambio de estación. Nuestro servicio de limpieza de hojas en otoño mantiene tu césped sano y tu propiedad con excelente aspecto durante los meses de otoño. Cuando llega el invierno, ofrecemos remoción de nieve con disponibilidad en tormentas para mantener tus aceras, escalones y entrada despejados y seguros.

Si vives en Weehawken y buscas un cuidado de césped confiable de una empresa local del condado de Hudson, contacta a Rootline Landscaping para una estimación gratuita.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Propietarios de townhomes",
      "Arrendadores",
      "Propiedades residenciales compactas",
      "Propiedades en ladera",
      "Propiedades en zona waterfront",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Weehawken, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales para propiedades residenciales en Weehawken, incluyendo patios compactos y viviendas en ladera.",
      },
      {
        q: "¿Trabajan con patios pequeños y propiedades de acceso reducido en Weehawken?",
        a: "Por supuesto. Nos especializamos en los lotes residenciales compactos y las zonas de acceso reducido tan comunes en Weehawken. Nuestro personal y maquinaria están preparados para propiedades más pequeñas.",
      },
      {
        q: "¿Realizan limpieza estacional en Weehawken?",
        a: "Sí, ofrecemos limpiezas estacionales de primavera y otoño para que las propiedades en Weehawken luzcan bien todo el año y mantengan su presentación exterior.",
      },
      {
        q: "¿Realizan limpieza de hojas en Weehawken?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño en Weehawken, incluyendo propiedades en ladera donde las hojas suelen acumularse.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Weehawken?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en Weehawken, incluyendo aceras, escalones y entradas.",
      },
      {
        q: "¿Puedo programar cuidado de césped semanal o quincenal en Weehawken?",
        a: "Sí, ofrecemos programación flexible con opciones semanales y quincenales de cuidado de césped para propietarios en Weehawken.",
      },
    ],
  },
  "secaucus-nj": {
    metaTitle: "Cuidado de césped y limpieza estacional en Secaucus, NJ",
    intro: `Rootline Landscaping ofrece cuidado de césped y mantenimiento de propiedad en Secaucus, NJ. Secaucus combina barrios residenciales de estilo suburbano y pequeñas propiedades comerciales cerca de los Meadowlands, y atendemos ambos con un servicio profesional y confiable.

Nuestros clientes en Secaucus incluyen propietarios con céspedes residenciales más amplios, arrendadores que gestionan alquileres y dueños de pequeños comercios que necesitan mantenimiento constante del terreno. Ofrecemos corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve con la frecuencia que te convenga: semanal, quincenal o estacional según lo necesites.

Las zonas residenciales de Secaucus tienen patios que se benefician del mantenimiento regular. Nuestro equipo mantiene el césped sano y bien presentado con cortes a la altura adecuada, bordeado limpio a lo largo de entradas y aceras, y retiro completo de escombros después de cada visita. Llegamos según lo programado, completamos el trabajo con profesionalismo y dejamos tu propiedad impecable.

Para servicios estacionales, ofrecemos limpiezas completas de primavera y otoño. En otoño, las propiedades de Secaucus acumulan muchas hojas que deben retirarse para proteger la salud del césped y mantener la apariencia. Nuestro servicio de limpieza de hojas cubre el proceso completo, incluyendo jardineras, áreas de césped y disposición. En invierno, brindamos remoción de nieve con disponibilidad en tormentas para mantener tu propiedad segura y accesible.

Los propietarios en Secaucus valoran nuestro enfoque directo: programación confiable, trabajo limpio y precios justos. Si necesitas un proveedor de cuidado de césped en el que puedas confiar en Secaucus, contacta a Rootline Landscaping para una estimación gratuita.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Pequeñas propiedades comerciales",
      "Asociaciones de townhomes",
      "Administradores de propiedades",
      "Propietarios de inmuebles de alquiler",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Secaucus, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales para propiedades residenciales y pequeños comercios en Secaucus.",
      },
      {
        q: "¿Ofrecen cuidado de césped recurrente en Secaucus?",
        a: "Sí, ofrecemos servicio recurrente semanal y quincenal de cuidado de césped en Secaucus. El servicio recurrente mantiene tu césped en buen estado toda la temporada.",
      },
      {
        q: "¿Realizan limpieza de hojas en Secaucus?",
        a: "Sí, ofrecemos limpieza y retiro completo de hojas en otoño en Secaucus, incluyendo áreas de césped, jardineras y disposición de escombros.",
      },
      {
        q: "¿Puedo solicitar cuidado de césped semanal o quincenal en Secaucus?",
        a: "Sí, ofrecemos programación flexible, incluyendo servicio semanal y quincenal de cuidado de césped en Secaucus según tus necesidades.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Secaucus?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades residenciales y pequeños comercios en Secaucus.",
      },
      {
        q: "¿Atienden pequeñas propiedades comerciales en Secaucus?",
        a: "Sí, trabajamos con dueños de pequeños comercios en Secaucus que necesitan mantenimiento confiable del terreno y cuidado de césped.",
      },
    ],
  },
  "kearny-nj": {
    metaTitle: "Cuidado de césped y limpieza de patio en Kearny, NJ",
    intro: `Rootline Landscaping atiende Kearny, NJ, con servicios profesionales de cuidado de césped y mantenimiento de propiedad. Kearny cuenta con barrios residenciales consolidados y patios tradicionales que requieren mantenimiento regular, y eso es exactamente lo que ofrecemos: un cuidado de césped confiable y profesional en el que puedes contar semana tras semana.

Nuestros servicios en Kearny incluyen corte de césped, recorte, bordeado, limpieza de patio, limpieza estacional, retiro de hojas y servicio de nieve. Trabajamos con propietarios que quieren que su propiedad luzca bien mantenida, arrendadores que necesitan servicio constante para alquileres y dueños de pequeños comercios que requieren mantenimiento profesional del terreno.

Los patios de Kearny se benefician del corte semanal o quincenal durante la temporada de crecimiento. Nuestro equipo corta a la altura adecuada para la salud del césped, recorta alrededor de obstáculos y cercas, bordea entradas y aceras y sopla escombros de superficies duras. Cuando nos vamos, tu propiedad luce limpia y profesionalmente mantenida.

Para servicios estacionales, realizamos una limpieza completa de primavera para retirar escombros del invierno y preparar el césped para la temporada de crecimiento. En otoño, nuestro servicio de limpieza de hojas retira las hojas acumuladas del césped y las jardineras antes de que dañen el pasto. En invierno, ofrecemos remoción de nieve con disponibilidad en tormentas para mantener tu entrada, aceras y escalones despejados y seguros.

Los propietarios en Kearny eligen Rootline Landscaping porque llegamos según lo programado, hacemos un trabajo limpio y cobramos precios justos. Si buscas un proveedor de cuidado de césped que realmente cumpla lo prometido, contáctanos para una estimación gratuita.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propietarios de inmuebles de alquiler",
      "Pequeñas propiedades comerciales",
      "Propietarios de propiedades multifamiliares",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Kearny, NJ?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesionales para propiedades residenciales en Kearny.",
      },
      {
        q: "¿Ofrecen cuidado de césped semanal en Kearny?",
        a: "Sí, ofrecemos servicio semanal y quincenal de cuidado de césped para propietarios y arrendadores en Kearny que buscan mantenimiento constante y confiable.",
      },
      {
        q: "¿Trabajan con arrendadores y propiedades de alquiler en Kearny?",
        a: "Sí, atendemos a muchos arrendadores en Kearny que necesitan cuidado de césped confiable para sus propiedades de alquiler. Un servicio constante ayuda a mantener el valor del inmueble y la satisfacción de los inquilinos.",
      },
      {
        q: "¿Realizan limpieza de hojas en Kearny?",
        a: "Sí, ofrecemos limpieza y retiro de hojas en otoño para propiedades en Kearny, incluyendo retiro y disposición completa de escombros.",
      },
      {
        q: "¿Ofrecen remoción de nieve en Kearny?",
        a: "Sí, brindamos remoción de nieve con disponibilidad en tormentas de invierno para propiedades en Kearny.",
      },
      {
        q: "¿Atienden pequeñas propiedades comerciales en Kearny?",
        a: "Sí, ofrecemos mantenimiento del terreno y cuidado de césped para pequeñas propiedades comerciales en Kearny.",
      },
    ],
  },
  "bayonne-nj": {
    intro: `Rootline Landscaping ofrece cuidado de césped y mantenimiento de propiedad en Bayonne, NJ. Atendemos a propietarios de vivienda y arrendadores en Bayonne con corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve profesionales. Contáctanos para confirmar si podemos atender tu propiedad en Bayonne.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Propiedades de alquiler",
    ],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Bayonne, NJ?",
        a: "Sí, ofrecemos corte de césped en zonas selectas de Bayonne. Contáctanos para confirmar disponibilidad.",
      },
      {
        q: "¿Realizan limpieza de hojas en Bayonne?",
        a: "Sí, ofrecemos limpieza de hojas en otoño en Bayonne.",
      },
    ],
  },
  "bergen-county-nj": {
    intro: `Rootline Landscaping atiende con orgullo Bergen County, NJ con cuidado de césped y mantenimiento de propiedad profesional. Atendemos Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y zonas del norte de New Jersey. Ofrecemos corte de césped, recorte, bordeado, limpiezas estacionales, retiro de hojas y servicio de nieve para propietarios, arrendadores y pequeñas propiedades comerciales en Bergen County.`,
    whoWeServe: [
      "Propietarios de vivienda",
      "Arrendadores",
      "Pequeñas propiedades comerciales",
    ],
    faqs: [
      {
        q: "¿Atienden el condado de Bergen, NJ?",
        a: "Sí. Atendemos Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y zonas del norte de New Jersey en Bergen County.",
      },
      {
        q: "¿Ofrecen corte de césped en el condado de Bergen?",
        a: "Sí, ofrecemos corte de césped, recorte, bordeado y soplado profesional en todo Bergen County.",
      },
    ],
  },
  "teaneck-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Teaneck, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Teaneck, NJ?",
        a: "Sí, ofrecemos corte de césped en Teaneck. Contáctanos para programar el servicio.",
      },
    ],
  },
  "paramus-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Paramus, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Paramus, NJ?",
        a: "Sí, ofrecemos corte de césped en Paramus. Contáctanos para programar el servicio.",
      },
    ],
  },
  "ridgewood-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Ridgewood, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Ridgewood, NJ?",
        a: "Sí, ofrecemos corte de césped en Ridgewood. Contáctanos para programar el servicio.",
      },
    ],
  },
  "englewood-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Englewood, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Englewood, NJ?",
        a: "Sí, ofrecemos corte de césped en Englewood. Contáctanos para programar el servicio.",
      },
    ],
  },
  "fair-lawn-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Fair Lawn, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Fair Lawn, NJ?",
        a: "Sí, ofrecemos corte de césped en Fair Lawn. Contáctanos para programar el servicio.",
      },
    ],
  },
  "garfield-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Garfield, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Garfield, NJ?",
        a: "Sí, ofrecemos corte de césped en Garfield. Contáctanos para programar el servicio.",
      },
    ],
  },
  "bergenfield-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Bergenfield, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Bergenfield, NJ?",
        a: "Sí, ofrecemos corte de césped en Bergenfield. Contáctanos para programar el servicio.",
      },
    ],
  },
  "tenafly-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Tenafly, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Tenafly, NJ?",
        a: "Sí, ofrecemos corte de césped en Tenafly. Contáctanos para programar el servicio.",
      },
    ],
  },
  "westwood-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Westwood, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Westwood, NJ?",
        a: "Sí, ofrecemos corte de césped en Westwood. Contáctanos para programar el servicio.",
      },
    ],
  },
  "hillsdale-nj": {
    intro: `Rootline Landscaping ofrece servicios de cuidado de césped en Hillsdale, NJ. Contáctanos para corte de césped, limpieza estacional y mantenimiento de propiedad.`,
    whoWeServe: ["Propietarios de vivienda", "Arrendadores"],
    faqs: [
      {
        q: "¿Ofrecen corte de césped en Hillsdale, NJ?",
        a: "Sí, ofrecemos corte de césped en Hillsdale. Contáctanos para programar el servicio.",
      },
    ],
  },
}
