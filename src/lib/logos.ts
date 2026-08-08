/**
 * Crest catalogue — every logo a team can wear.
 *
 * Each entry is a single glyph plus searchable keywords. The glyph is rendered
 * inside a generated gradient crest (see `TeamCrest`), which is what makes a
 * plain character read as a proper team badge. Keeping the source data this
 * small is deliberate: it means the catalogue can be enormous without shipping
 * hundreds of image requests, and it renders identically on a projector, a
 * phone and a screenshot.
 *
 * Everything here is science- or nature-themed. Nothing else belongs in it.
 */

export type LogoCategory = {
  id: string;
  label: string;
  blurb: string;
};

export type Logo = {
  id: string;
  glyph: string;
  label: string;
  category: string;
  keywords: string[];
};

export const LOGO_CATEGORIES: LogoCategory[] = [
  { id: "trees", label: "Trees & Leaves", blurb: "Canopy, bark and everything that falls from it" },
  {
    id: "flowers",
    label: "Flowers & Blooms",
    blurb: "Petals, pollinator magnets and meadow colour",
  },
  {
    id: "fungi",
    label: "Fungi & Small Growth",
    blurb: "Mushrooms, moss and the quiet decomposers",
  },
  { id: "mammals", label: "Mammals", blurb: "Fur, paws and warm blood" },
  { id: "birds", label: "Birds", blurb: "Feathers, flight and dawn chorus" },
  { id: "reptiles", label: "Reptiles & Amphibians", blurb: "Scales, shells and slow blinking" },
  { id: "sealife", label: "Ocean & Freshwater", blurb: "Fins, tentacles and tidal life" },
  { id: "bugs", label: "Insects & Arthropods", blurb: "Six legs, eight legs, and a lot of them" },
  { id: "prehistoric", label: "Fossils & Prehistoric", blurb: "Deep time and very large teeth" },
  { id: "weather", label: "Weather & Sky", blurb: "Fronts, storms and the atmosphere" },
  { id: "space", label: "Space & Astronomy", blurb: "Orbits, light-years and the very far away" },
  { id: "earth", label: "Earth & Geology", blurb: "Rock, magma and the ground under it all" },
  { id: "water", label: "Water & Ice", blurb: "The cycle, in all three phases" },
  { id: "lab", label: "Lab & Chemistry", blurb: "Glassware, reagents and careful measurement" },
  { id: "biology", label: "Biology & Health", blurb: "Cells, genes and the systems they build" },
  { id: "physics", label: "Physics & Energy", blurb: "Forces, fields and the flow of power" },
  { id: "field", label: "Field Gear & Tools", blurb: "What you carry when the lab is outside" },
  { id: "outdoors", label: "Outdoors & Expedition", blurb: "Trails, camps and the long way round" },
];

/**
 * Compact source format: "glyph Label | extra keywords".
 * Keeps the catalogue readable and diff-friendly at this size.
 */
const RAW: Record<string, string[]> = {
  trees: [
    "🌿 Herb Sprig | green leaves branch",
    "🍃 Drifting Leaves | wind breeze foliage",
    "🌱 Seedling | sprout new growth start",
    "🌲 Evergreen | conifer spruce pine",
    "🌳 Broadleaf Tree | oak canopy deciduous",
    "🌴 Palm | tropical coast frond",
    "🪵 Fallen Log | wood timber deadwood",
    "🍂 Autumn Fall | dry leaves litter",
    "🍁 Maple Leaf | autumn sugar maple",
    "☘️ Shamrock | clover trefoil",
    "🍀 Four-Leaf Clover | luck clover",
    "🎋 Bamboo Stalk | tanabata grass",
    "🎍 Pine Decoration | kadomatsu bamboo",
    "🪴 Potted Plant | houseplant cultivate",
    "🌾 Grain Stalks | wheat rice cereal",
    "🌵 Cactus | desert succulent arid",
    "🪺 Nest with Eggs | nesting brood",
    "🌰 Acorn | chestnut seed nut",
    "🫒 Olive | fruit branch mediterranean",
    "🥥 Coconut | palm fruit tropical",
    "🍇 Grapes | vine fruit cluster",
    "🍎 Apple | orchard fruit pome",
    "🍐 Pear | orchard fruit",
    "🍑 Peach | stone fruit",
    "🍒 Cherries | stone fruit orchard",
    "🫐 Blueberries | berries bush",
    "🍓 Strawberry | berry runner",
    "🥝 Kiwi | fruit vine",
    "🍋 Lemon | citrus acid",
    "🍊 Orange | citrus tangerine",
    "🥑 Avocado | fruit stone",
    "🌽 Corn | maize crop",
    "🥕 Carrot | root vegetable",
    "🫛 Pea Pod | legume nitrogen",
    "🥦 Broccoli | brassica vegetable",
    "🍄‍🟫 Brown Mushroom | fungus forest floor",
  ],
  flowers: [
    "🌸 Cherry Blossom | sakura spring petal",
    "🌺 Hibiscus | tropical bloom",
    "🌻 Sunflower | helianthus heliotropism",
    "🌹 Rose | thorn bloom",
    "🌷 Tulip | bulb spring",
    "🌼 Daisy | wildflower composite",
    "💐 Bouquet | flowers bunch",
    "🪷 Lotus | pond waterlily",
    "🥀 Wilted Bloom | decay senescence",
    "🏵️ Rosette | ornament bloom",
    "💮 White Flower | blossom stamp",
    "🪻 Hyacinth | bellflower spring bulb",
    "🫧 Pollen Bubbles | spores drift",
  ],
  fungi: [
    "🍄 Toadstool | mushroom fungus spore",
    "🧫 Petri Culture | agar colony microbe",
    "🦠 Microbe | bacteria amoeba germ",
    "🪱 Earthworm | soil annelid compost",
    "🪵 Rotting Wood | decomposer detritus",
    "🌱 Mycelium Shoot | hyphae network",
    "🫘 Legume Seed | bean nodule",
    "🧬 Spore Helix | genetics fungal",
  ],
  mammals: [
    "🦊 Fox | vulpes cunning",
    "🐺 Wolf | pack canid howl",
    "🐻 Bear | ursus forest",
    "🐻‍❄️ Polar Bear | arctic ice ursus",
    "🐼 Panda | bamboo bear",
    "🦁 Lion | savanna pride cat",
    "🐯 Tiger | stripes big cat",
    "🐆 Leopard | spots big cat cheetah",
    "🐅 Prowling Tiger | predator stalk",
    "🦓 Zebra | stripes savanna equid",
    "🦌 Deer | antler stag cervid",
    "🫎 Moose | elk antler boreal",
    "🫏 Donkey | equid burro",
    "🐘 Elephant | tusk herd",
    "🦣 Mammoth | ice age tusk",
    "🦏 Rhinoceros | horn megafauna",
    "🦛 Hippopotamus | river megafauna",
    "🐪 Camel | desert dromedary",
    "🐫 Bactrian Camel | desert two hump",
    "🦒 Giraffe | tall savanna browse",
    "🦘 Kangaroo | marsupial hop",
    "🦥 Sloth | slow arboreal",
    "🦦 Otter | river mustelid",
    "🦫 Beaver | dam rodent engineer",
    "🦡 Badger | burrow mustelid",
    "🦨 Skunk | musk mustelid",
    "🦔 Hedgehog | spines insectivore",
    "🐿️ Squirrel | chipmunk cache rodent",
    "🐇 Hare | rabbit lagomorph",
    "🐀 Rat | rodent",
    "🐁 Mouse | rodent small",
    "🦇 Bat | echolocation chiroptera",
    "🐗 Wild Boar | suid tusk",
    "🐐 Goat | caprine mountain",
    "🐑 Sheep | ovine flock wool",
    "🐄 Cow | bovine cattle",
    "🐎 Horse | equine gallop",
    "🦬 Bison | prairie bovid",
    "🐃 Water Buffalo | bovine wetland",
    "🦙 Llama | camelid andes",
    "🦧 Orangutan | ape primate",
    "🦍 Gorilla | ape primate",
    "🐒 Monkey | primate troop",
    "🐨 Koala | marsupial eucalyptus",
    "🐕 Dog | canid",
    "🐈 Cat | feline",
    "🐈‍⬛ Black Cat | feline melanistic",
    "🦮 Working Dog | guide canid",
  ],
  birds: [
    "🦅 Eagle | raptor talon soar",
    "🦉 Owl | nocturnal raptor",
    "🦆 Duck | waterfowl dabbling",
    "🦢 Swan | waterfowl cygnus",
    "🦩 Flamingo | wader filter feeder",
    "🦚 Peacock | peafowl display",
    "🦜 Parrot | tropical psittacine",
    "🕊️ Dove | peace columbid",
    "🐦 Songbird | passerine perch",
    "🐦‍⬛ Blackbird | corvid passerine",
    "🐧 Penguin | antarctic flightless",
    "🐓 Rooster | fowl crow dawn",
    "🐔 Hen | fowl",
    "🐤 Chick | hatchling fledgling",
    "🐣 Hatching Egg | brood emerge",
    "🥚 Egg | shell embryo",
    "🦃 Turkey | fowl wild",
    "🪶 Feather | plume quill",
    "🦤 Dodo | extinct raphus",
    "🐦‍🔥 Firebird | phoenix plumage",
    "🪹 Empty Nest | twigs nesting",
  ],
  reptiles: [
    "🐢 Tortoise | turtle shell chelonian",
    "🐍 Snake | serpent scale",
    "🦎 Lizard | gecko scale",
    "🐊 Crocodile | alligator archosaur",
    "🐸 Frog | amphibian anuran",
    "🐲 Dragon Face | mythic scale",
    "🐉 Dragon | mythic serpent",
    "🦕 Sauropod | dinosaur longneck",
    "🦖 Tyrannosaur | dinosaur theropod",
    "🥚 Reptile Egg | clutch nest",
  ],
  sealife: [
    "🐬 Dolphin | cetacean pod",
    "🐳 Spouting Whale | cetacean baleen",
    "🐋 Blue Whale | cetacean deep",
    "🦈 Shark | elasmobranch predator",
    "🐙 Octopus | cephalopod arms",
    "🦑 Squid | cephalopod deep",
    "🦐 Shrimp | crustacean krill",
    "🦞 Lobster | crustacean claw",
    "🦀 Crab | crustacean tide pool",
    "🐚 Spiral Shell | mollusc conch",
    "🪸 Coral | reef polyp",
    "🪼 Jellyfish | medusa cnidarian",
    "🐠 Reef Fish | tropical",
    "🐟 Fish | teleost",
    "🐡 Pufferfish | tetraodon",
    "🦭 Seal | pinniped",
    "🐊 River Predator | wetland",
    "🌊 Wave | ocean swell current",
    "🫧 Bubbles | oxygen dissolved",
    "🎣 Angling | fishing survey",
    "🦦 River Otter | riparian",
    "⚓ Anchor | marine research",
  ],
  bugs: [
    "🐝 Honeybee | pollinator hive apis",
    "🦋 Butterfly | lepidoptera metamorphosis",
    "🐛 Caterpillar | larva instar",
    "🐌 Snail | gastropod mollusc",
    "🐞 Ladybird | ladybug coccinellid",
    "🦗 Cricket | orthoptera chirp",
    "🕷️ Spider | arachnid",
    "🕸️ Web | orb weaver silk",
    "🦂 Scorpion | arachnid venom",
    "🪲 Beetle | coleoptera elytra",
    "🪳 Cockroach | blattodea",
    "🦟 Mosquito | vector culicidae",
    "🪰 Fly | diptera",
    "🐜 Ant | colony formicidae",
    "🪱 Worm | annelid soil",
    "🦠 Protozoa | single celled",
  ],
  prehistoric: [
    "🦖 T. Rex | theropod cretaceous",
    "🦕 Brontosaur | sauropod jurassic",
    "🦣 Woolly Mammoth | pleistocene tusk",
    "🦴 Bone | skeleton fossil",
    "🦷 Tooth | dentition fossil",
    "🪨 Fossil Bed | strata rock",
    "🗿 Ancient Stone | monolith carved",
    "⛏️ Excavation | dig pickaxe",
    "🔎 Fossil Hunt | search magnify",
    "🐚 Ammonite | spiral fossil shell",
    "🪵 Petrified Wood | mineralised",
    "🦤 Extinct Bird | dodo lost species",
  ],
  weather: [
    "☀️ Sun | clear insolation",
    "🌤️ Sun Behind Cloud | partly cloudy",
    "⛅ Broken Cloud | scattered",
    "🌥️ Overcast | stratus grey",
    "☁️ Cloud | cumulus vapour",
    "🌦️ Sun Shower | rain sun",
    "🌧️ Rain | precipitation shower",
    "⛈️ Thunderstorm | lightning cell",
    "🌩️ Lightning | discharge bolt",
    "🌨️ Snowfall | precipitation flake",
    "❄️ Snowflake | crystal frost",
    "☃️ Snow Figure | winter snowman",
    "⛄ Snow Drift | winter",
    "🌬️ Wind | gust airflow",
    "🌪️ Tornado | vortex funnel",
    "🌫️ Fog | mist visibility",
    "🌈 Rainbow | refraction spectrum",
    "🌡️ Thermometer | temperature reading",
    "💨 Gust | airflow current",
    "🌀 Cyclone | spiral low pressure",
    "🔥 Heat | wildfire flame",
    "🥶 Cold Snap | freeze frost",
  ],
  space: [
    "🪐 Ringed Planet | saturn gas giant",
    "🌍 Earth Europe Africa | globe planet",
    "🌎 Earth Americas | globe planet",
    "🌏 Earth Asia | globe planet",
    "🌕 Full Moon | lunar phase",
    "🌖 Waning Gibbous | lunar phase",
    "🌗 Last Quarter | lunar phase",
    "🌘 Waning Crescent | lunar phase",
    "🌑 New Moon | lunar phase",
    "🌒 Waxing Crescent | lunar phase",
    "🌓 First Quarter | lunar phase",
    "🌔 Waxing Gibbous | lunar phase",
    "🌙 Crescent | lunar night",
    "🌚 New Moon Face | lunar",
    "🌝 Full Moon Face | lunar",
    "🌛 First Quarter Face | lunar",
    "🌜 Last Quarter Face | lunar",
    "⭐ Star | stellar point",
    "🌟 Glowing Star | stellar bright",
    "✨ Sparkles | starlight shimmer",
    "💫 Comet Trail | dizzy orbit",
    "☄️ Comet | ice tail perihelion",
    "🌠 Shooting Star | meteor",
    "🔭 Telescope | observatory optics",
    "🛰️ Satellite | orbit remote sensing",
    "🚀 Rocket | launch propulsion",
    "🛸 Saucer | ufo unidentified",
    "👨‍🚀 Astronaut | crew eva",
    "🌌 Milky Way | galaxy night sky",
    "🌃 Night Sky | stars city",
    "🪞 Mirror Optic | reflector telescope",
    "🧭 Celestial Compass | navigation",
  ],
  earth: [
    "⛰️ Mountain | peak massif",
    "🏔️ Snow-Capped Peak | alpine summit",
    "🌋 Volcano | magma eruption",
    "🗻 Cone Volcano | fuji stratovolcano",
    "🪨 Rock | boulder mineral",
    "🏜️ Desert | arid dune",
    "🏞️ National Park | valley river",
    "🏝️ Island | atoll coast",
    "🏖️ Shoreline | beach sand",
    "🕳️ Cave | sinkhole karst",
    "⛏️ Pickaxe | mining core sample",
    "💎 Gemstone | crystal mineral",
    "🧱 Strata | brick layer sediment",
    "🌐 Globe Grid | meridian coordinates",
    "🗺️ Map | survey cartography",
    "🧭 Compass | bearing navigation",
    "🏕️ Basecamp | field site",
    "🛤️ Ridge Line | track transect",
  ],
  water: [
    "💧 Droplet | water molecule",
    "💦 Splash | spray droplets",
    "🌊 Ocean Wave | swell surf",
    "🧊 Ice Cube | frozen solid",
    "❄️ Ice Crystal | frost lattice",
    "🚿 Flow | shower stream",
    "🪣 Sample Bucket | collection",
    "🥤 Turbidity Sample | cup measure",
    "♨️ Hot Spring | geothermal steam",
    "⛲ Fountain | pressure jet",
    "🏞️ River | watershed channel",
    "🫗 Pouring | decant volume",
  ],
  lab: [
    "🔬 Microscope | optics magnify slide",
    "🧪 Test Tube | reagent sample",
    "⚗️ Alembic | distillation retort",
    "🧫 Petri Dish | culture agar",
    "🧬 DNA | double helix genome",
    "🥼 Lab Coat | ppe safety",
    "🧤 Gloves | ppe nitrile",
    "🥽 Safety Goggles | ppe eye protection",
    "⚖️ Balance | mass weighing",
    "🌡️ Thermometer | temperature probe",
    "🔍 Magnifier | inspect lens",
    "🔎 Magnifier Right | inspect lens",
    "📊 Bar Chart | data results",
    "📈 Rising Trend | data growth",
    "📉 Falling Trend | data decline",
    "📋 Clipboard | protocol record",
    "📝 Field Notes | write log",
    "🖊️ Pen | record ink",
    "📏 Ruler | length measure",
    "📐 Set Square | geometry angle",
    "⏱️ Stopwatch | timing interval",
    "⏲️ Timer | countdown reaction",
    "🧮 Abacus | calculation counting",
    "💊 Capsule | dose compound",
    "🩹 Plaster | first aid",
    "☣️ Biohazard | containment",
    "☢️ Radioactive | isotope hazard",
    "⚠️ Hazard | caution warning",
    "🔥 Bunsen Flame | heat combustion",
    "❄️ Cryogenic | freeze storage",
    "🧴 Reagent Bottle | solution dispense",
    "🪫 Low Cell | battery discharge",
  ],
  biology: [
    "🧬 Genome | dna helix sequence",
    "🦠 Cell | microbe pathogen",
    "🫀 Heart Organ | circulatory cardiac",
    "🫁 Lungs | respiratory gas exchange",
    "🧠 Brain | neural cortex",
    "🦴 Skeleton Bone | structure calcium",
    "🦷 Tooth | enamel dentition",
    "👁️ Eye | vision optics retina",
    "👂 Ear | hearing auditory",
    "👃 Nose | olfaction smell",
    "🩸 Blood Drop | haematology plasma",
    "🩺 Stethoscope | diagnosis vitals",
    "💉 Syringe | injection sample",
    "🧠 Neuron Web | synapse network",
    "🫧 Osmosis | membrane bubble",
    "🌡️ Body Temp | fever homeostasis",
    "🏃 Metabolism | exercise energy",
    "🥗 Nutrition | diet greens",
    "😴 Circadian | sleep rhythm",
  ],
  physics: [
    "⚛️ Atom | nucleus orbital",
    "🧲 Magnet | field poles",
    "⚡ Current | electricity charge",
    "🔋 Battery | cell voltage stored",
    "💡 Bulb | photon illumination",
    "🔌 Plug | circuit mains",
    "🪫 Discharged | battery empty",
    "☀️ Solar | photovoltaic radiation",
    "🌀 Vortex | spiral angular momentum",
    "🎯 Precision | accuracy target",
    "⚙️ Gear | mechanics torque",
    "🔩 Bolt | fastener structure",
    "🛠️ Tools | build engineering",
    "📡 Antenna | signal transmission",
    "🔊 Sound | wave amplitude",
    "🌈 Spectrum | dispersion prism",
    "🔦 Beam | torch photon",
    "⏳ Half-Life | decay hourglass",
    "🎚️ Amplitude | slider level",
    "♾️ Infinity | limit unbounded",
    "➗ Division | maths operator",
    "🧊 Phase Change | state matter",
  ],
  field: [
    "🔦 Head Torch | night survey",
    "🧭 Field Compass | bearing",
    "🗺️ Topo Map | contour navigation",
    "🎒 Field Pack | rucksack kit",
    "🥾 Boots | hiking traverse",
    "🧤 Field Gloves | handling",
    "🪢 Rope Knot | rigging line",
    "🔭 Spotting Scope | observe distance",
    "📷 Camera | documentation photo",
    "📸 Flash Photo | record capture",
    "🎥 Video Log | film record",
    "🔋 Power Bank | charge field",
    "🪜 Ladder | access canopy",
    "🪤 Live Trap | survey capture",
    "🧺 Sample Basket | collection",
    "🪣 Bucket | quadrat sample",
    "🥄 Soil Scoop | core sample",
    "⛑️ Safety Helmet | protection",
    "🦺 Hi-Vis | visibility safety",
    "🚩 Marker Flag | plot transect",
    "📍 Waypoint | pin location",
    "🛎️ Signal Bell | alert",
  ],
  outdoors: [
    "🏕️ Camp | tent overnight",
    "⛺ Tent | shelter bivouac",
    "🔥 Campfire | flame warmth",
    "🌄 Sunrise Over Hills | dawn alpenglow",
    "🌅 Sunrise | dawn horizon",
    "🌇 Sunset | dusk horizon",
    "🌌 Star Camp | night sky",
    "🥾 Trail Boots | hike",
    "🚵 Trail Ride | mountain bike",
    "🧗 Climber | ascent rock",
    "🛶 Canoe | paddle river",
    "🚣 Rowing | boat survey",
    "🏄 Surf | wave board",
    "🤿 Dive | snorkel underwater",
    "⛷️ Ski | snow traverse",
    "🏂 Snowboard | snow",
    "🧘 Stillness | observe patience",
    "🥇 Gold Medal | first place",
    "🥈 Silver Medal | second place",
    "🥉 Bronze Medal | third place",
    "🏆 Trophy | champion cup",
    "🏅 Award Medal | achievement",
    "🎖️ Honour | commendation",
    "🎯 Bullseye | goal accuracy",
    "🧗‍♀️ Ascent | climb route",
    "🛖 Field Hut | shelter station",
    "🌉 Crossing | bridge span",
    "🚞 Mountain Line | route travel",
  ],
};

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function build(): Logo[] {
  const out: Logo[] = [];
  const seen = new Set<string>();
  for (const category of Object.keys(RAW)) {
    for (const line of RAW[category]) {
      const [head, extra = ""] = line.split("|");
      const trimmed = head.trim();
      const spaceAt = trimmed.indexOf(" ");
      const glyph = trimmed.slice(0, spaceAt);
      const label = trimmed.slice(spaceAt + 1).trim();
      let id = `${category}-${slug(label)}`;
      // Labels are unique per category by construction, but guard anyway so a
      // future edit can never silently collapse two crests into one.
      let n = 2;
      while (seen.has(id)) id = `${category}-${slug(label)}-${n++}`;
      seen.add(id);
      out.push({
        id,
        glyph,
        label,
        category,
        keywords: [
          label.toLowerCase(),
          category,
          ...extra.toLowerCase().split(/\s+/).filter(Boolean),
        ],
      });
    }
  }
  return out;
}

export const LOGOS: Logo[] = build();

const LOGO_BY_ID = new Map(LOGOS.map((l) => [l.id, l]));

export const LOGO_COUNT = LOGOS.length;

export function getLogo(id: string): Logo {
  return LOGO_BY_ID.get(id) ?? LOGOS[0];
}

export function isLogoId(id: string): boolean {
  return LOGO_BY_ID.has(id);
}

export function logosInCategory(categoryId: string): Logo[] {
  return LOGOS.filter((l) => l.category === categoryId);
}

/**
 * Score a single crest against one search term. Higher is better; 0 means no
 * match. Ranking matters here because a substring search over a catalogue this
 * size otherwise buries the obvious answer — "owl" would list Duck and Turkey
 * (both "waterfowl"/"fowl") right alongside the actual Owl.
 */
function scoreTerm(logo: Logo, term: string): number {
  const label = logo.label.toLowerCase();
  if (label === term) return 100;
  if (label.startsWith(term)) return 70;
  // Match at a word boundary inside the label, e.g. "moon" in "Full Moon".
  if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) return 55;
  if (label.includes(term)) return 30;

  let best = 0;
  for (const keyword of logo.keywords) {
    if (keyword === term) best = Math.max(best, 45);
    else if (keyword.startsWith(term)) best = Math.max(best, 25);
    else if (keyword.includes(term)) best = Math.max(best, 8);
  }
  return best;
}

export function searchLogos(query: string, categoryId?: string): Logo[] {
  const q = query.trim().toLowerCase();
  const pool = categoryId ? logosInCategory(categoryId) : LOGOS;
  if (!q) return pool;

  const terms = q.split(/\s+/);
  const scored: { logo: Logo; score: number }[] = [];

  for (const logo of pool) {
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      const score = scoreTerm(logo, term);
      if (score === 0) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll) scored.push({ logo, score: total });
  }

  // Ties keep catalogue order, which groups related crests together.
  return scored.sort((a, b) => b.score - a.score).map((s) => s.logo);
}

/** A pleasing spread of starting crests for a freshly configured season. */
export const SUGGESTED_LOGO_ORDER = [
  "trees-broadleaf-tree",
  "birds-eagle",
  "space-ringed-planet",
  "sealife-octopus",
  "mammals-fox",
  "lab-microscope",
  "weather-lightning",
  "earth-volcano",
  "bugs-honeybee",
  "prehistoric-t-rex",
  "flowers-sunflower",
  "physics-atom",
  "reptiles-tortoise",
  "fungi-toadstool",
  "water-ocean-wave",
  "mammals-wolf",
];

export function defaultLogoFor(index: number): string {
  const id = SUGGESTED_LOGO_ORDER[index % SUGGESTED_LOGO_ORDER.length];
  return isLogoId(id) ? id : LOGOS[0].id;
}

/** Names offered as one-tap suggestions in the setup wizard. */
export const SUGGESTED_TEAM_NAMES = [
  "Canopy",
  "Talon",
  "Orbit",
  "Tidepool",
  "Emberfox",
  "Lens",
  "Tempest",
  "Caldera",
  "Hivemind",
  "Fossil",
  "Heliotrope",
  "Quantum",
  "Carapace",
  "Mycelia",
  "Undertow",
  "Nightpack",
];
