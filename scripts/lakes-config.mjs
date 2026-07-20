// The list of lakes this site tracks. Adding a lake is just adding an entry
// here — everything else (fetching, page generation, the directory table)
// is driven off this list.
//
// Curated rather than exhaustive: TWDB tracks 122 Texas reservoirs total,
// but most are small agricultural tanks nobody's checking on. This list is
// every lake that's either the water supply for a major Texas metro, or has
// enough standalone cultural/historical weight to draw visitors on its own
// (Caddo's cypress swamp, Texoma's name recognition, Possum Kingdom's age,
// the two currently-critical San Angelo lakes, etc).

export const LAKES = [
  { slug: "medina", name: "Medina Lake", city: "San Antonio", location: "near San Antonio, Texas" },
  { slug: "travis", name: "Lake Travis", city: "Austin", location: "near Austin, Texas" },
  { slug: "buchanan", name: "Lake Buchanan", city: "Austin", location: "in the Highland Lakes chain near Austin, Texas" },
  { slug: "lyndon-b-johnson", name: "Lake LBJ", city: "Austin", location: "in the Highland Lakes chain near Austin, Texas" },
  { slug: "canyon", name: "Canyon Lake", city: "New Braunfels", location: "near New Braunfels, Texas" },
  { slug: "choke-canyon", name: "Choke Canyon Reservoir", city: "Corpus Christi", location: "near Corpus Christi, Texas" },
  { slug: "conroe", name: "Lake Conroe", city: "Houston", location: "near Houston, Texas" },
  { slug: "livingston", name: "Lake Livingston", city: "Houston", location: "near Houston, Texas" },
  { slug: "houston", name: "Lake Houston", city: "Houston", location: "in Houston, Texas" },
  { slug: "somerville", name: "Lake Somerville", city: "College Station", location: "near College Station, Texas" },
  { slug: "ray-roberts", name: "Lake Ray Roberts", city: "Dallas", location: "near Dallas, Texas" },
  { slug: "lewisville", name: "Lewisville Lake", city: "Dallas", location: "near Dallas, Texas" },
  { slug: "grapevine", name: "Grapevine Lake", city: "Dallas-Fort Worth", location: "in the Dallas-Fort Worth area" },
  { slug: "ray-hubbard", name: "Lake Ray Hubbard", city: "Dallas", location: "near Dallas, Texas" },
  { slug: "lavon", name: "Lavon Lake", city: "Dallas", location: "near Dallas, Texas" },
  { slug: "tawakoni", name: "Lake Tawakoni", city: "Dallas", location: "east of Dallas, Texas" },
  { slug: "cedar-creek", name: "Cedar Creek Reservoir", city: "Dallas", location: "southeast of Dallas, Texas" },
  { slug: "richland-chambers", name: "Richland-Chambers Reservoir", city: "Dallas-Fort Worth", location: "south of Dallas-Fort Worth, Texas" },
  { slug: "joe-pool", name: "Joe Pool Lake", city: "Dallas-Fort Worth", location: "in the Dallas-Fort Worth area" },
  { slug: "benbrook", name: "Benbrook Lake", city: "Fort Worth", location: "near Fort Worth, Texas" },
  { slug: "eagle-mountain", name: "Eagle Mountain Lake", city: "Fort Worth", location: "near Fort Worth, Texas" },
  { slug: "bridgeport", name: "Lake Bridgeport", city: "Fort Worth", location: "near Fort Worth, Texas" },
  { slug: "waco", name: "Lake Waco", city: "Waco", location: "in Waco, Texas" },
  { slug: "abilene", name: "Lake Abilene", city: "Abilene", location: "near Abilene, Texas" },
  { slug: "fort-phantom-hill", name: "Fort Phantom Hill Reservoir", city: "Abilene", location: "near Abilene, Texas" },
  { slug: "hubbard-creek", name: "Hubbard Creek Reservoir", city: "Abilene", location: "near Abilene, Texas" },
  { slug: "o-c-fisher", name: "O.C. Fisher Reservoir", city: "San Angelo", location: "near San Angelo, Texas" },
  { slug: "twin-buttes", name: "Twin Buttes Reservoir", city: "San Angelo", location: "near San Angelo, Texas" },
  { slug: "o-h-ivie", name: "O.H. Ivie Reservoir", city: "San Angelo", location: "near San Angelo, Texas" },
  { slug: "e-v-spence", name: "E.V. Spence Reservoir", city: "San Angelo", location: "near San Angelo, Texas" },
  { slug: "meredith", name: "Lake Meredith", city: "Amarillo", location: "near Amarillo, Texas" },
  { slug: "corpus-christi", name: "Lake Corpus Christi", city: "Corpus Christi", location: "near Corpus Christi, Texas" },
  { slug: "toledo-bend", name: "Toledo Bend Reservoir", city: "East Texas", location: "on the Texas-Louisiana border" },
  { slug: "sam-rayburn", name: "Sam Rayburn Reservoir", city: "East Texas", location: "in East Texas" },
  { slug: "caddo", name: "Caddo Lake", city: "East Texas", location: "on the Texas-Louisiana border — a National Natural Landmark" },
  { slug: "amistad", name: "Amistad Reservoir", city: "Del Rio", location: "near Del Rio, Texas, on the US-Mexico border" },
  { slug: "falcon", name: "Falcon Lake", city: "Zapata", location: "near Zapata, Texas, on the US-Mexico border" },
  { slug: "texoma", name: "Lake Texoma", city: "Sherman-Denison", location: "on the Texas-Oklahoma border" },
  { slug: "possum-kingdom", name: "Possum Kingdom Lake", city: "Fort Worth", location: "west of Fort Worth, Texas — one of the state's oldest major reservoirs" },
];
