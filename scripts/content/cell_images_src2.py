"""More Wikimedia Commons cell micrographs (second batch, stored smaller), mainly as reference examples for the
cell identifier. Same format as cell_images_src.py; licences re-checked by scripts/fetch_commons.py.
From three research agents (2026-11-10) that verified each file through the Commons API."""

CELL_IMAGES2 = [
    # Public domain, NIAID
    {"commons_title": "File:E. coli Bacteria (7316101966).jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "bacterium", "title": "E. coli rods by SEM", "caption": "Rod-shaped Escherichia coli cells grown in culture and attached to a coverslip, imaged by scanning electron microscopy."},
    # Public domain, CDC
    {"commons_title": "File:Bacillus anthracis Gram.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "bacterium", "title": "Bacillus anthracis, Gram stain", "caption": "Long chains of Gram-positive Bacillus anthracis rods stained purple with the Gram stain, seen by brightfield light microscopy."},
    # Public domain, CDC/Dr. George P. Kubica
    {"commons_title": "File:Mycobacterium tuberculosis Ziehl-Neelsen stain 02.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "bacterium", "title": "M. tuberculosis, acid-fast stain", "caption": "Slender red Mycobacterium tuberculosis rods against a blue background after Ziehl-Neelsen acid-fast staining, imaged at 1000x."},
    # Public domain, The Red Lexicon
    {"commons_title": "File:Phase contrast image of L-form bacteria-Mark Leaver Newcastle University.jpeg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "bacterium", "title": "L-form bacteria, phase contrast", "caption": "Round, cell-wall-deficient L-form bacteria derived from Bacillus subtilis, seen by phase-contrast microscopy."},
    # Public domain, Eric Erbe, Christopher Pooley (USDA ARS)
    {"commons_title": "File:Staphylococcus aureus, 50,000x, USDA, ARS, EMU.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "bacterium", "title": "Staphylococcus aureus replica by TEM", "caption": "Staphylococcus aureus cells with their capsule, shown at 50,000x in a transmission electron micrograph of a metal-coated replica of a freeze-dried sample."},
    # CC BY-SA 4.0, Dr. Imre Oldal
    {"commons_title": "File:Anabaena circinalis phv.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cyanobacterium", "title": "Anabaena circinalis coils", "caption": "Coiled bead-like filaments of the cyanobacterium Anabaena circinalis from a water-quality sample, photographed on a light microscope at 400-600x."},
    # CC BY-SA 2.5, NEON_ja
    {"commons_title": "File:Oscillatoria sp.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "cyanobacterium", "title": "Oscillatoria filaments, DIC", "caption": "Unbranched green filaments of the cyanobacterium Oscillatoria imaged with differential interference contrast on a Leica DMRD microscope."},
    # Public domain, Barry Rosen (USGS)
    {"commons_title": "File:Lyngbya stained.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cyanobacterium", "title": "Lyngbya, chlorophyll and DNA", "caption": "Filaments of the cyanobacterium Lyngbya in fluorescence: natural chlorophyll fluorescence shows red and a DNA stain shows green."},
    # CC0, Luke Thompson and Nicki Watson (Chisholm Lab)
    {"commons_title": "File:Prochlorococcus marinus.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "cyanobacterium", "title": "Prochlorococcus by TEM", "caption": "Transmission electron micrograph of the tiny marine cyanobacterium Prochlorococcus marinus in section, tinted green."},
    # CC0, Anne Thompson (Chisholm Lab)
    {"commons_title": "File:Prochlorococcus MIT9215 SEM.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "cyanobacterium", "title": "Prochlorococcus by SEM", "caption": "Pseudo-coloured scanning electron micrograph of Prochlorococcus strain MIT9215 cells, each well under a micrometre across."},
    # CC BY-SA 4.0, Masa Zupancic
    {"commons_title": "File:Dolichospermum sp..jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cyanobacterium", "title": "Dolichospermum spiral filament", "caption": "A spiral, bead-like filament of the bloom-forming cyanobacterium Dolichospermum seen in a light microscope."},
    # CC BY-SA 4.0, Helga Stan-Lotter and Sergiu Fendrihan
    {"commons_title": "File:Halobacterium salinarum NRC-1.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "archaeon", "title": "Halobacterium salinarum rod", "caption": "Scanning electron micrograph of a single rod-shaped cell of the salt-loving archaeon Halobacterium salinarum NRC-1."},
    # CC BY-SA 4.0, Joseph Lannan and Sameer Thukral
    {"commons_title": "File:Haloquadratum Walsby SEM.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "archaeon", "title": "Square archaeon by SEM", "caption": "Scanning electron micrograph of Haloquadratum walsbyi, a haloarchaeon with flat, square cells."},
    # CC BY 2.5, Noor MAF, Parnell RS, Grant BS (PLoS ONE)
    {"commons_title": "File:Optical phase-contrast microscopy image of a Haloquadratum walsbyi square cell - PLoS ONE.png", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "archaeon", "title": "Haloquadratum, phase contrast", "caption": "Phase-contrast image of one square Haloquadratum walsbyi cell about 10 um across; the bright dots are gas vesicles."},
    # CC BY-SA 4.0, Microvenator
    {"commons_title": "File:Methanosarcina acetivorans, type strain C2A.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "archaeon", "title": "Methanosarcina, phase contrast", "caption": "Phase-contrast view of round cells of the methane-producing archaeon Methanosarcina acetivorans, type strain C2A."},
    # CC BY 4.0, Kletzin A, Heimerl T, Flechsler J et al.
    {"commons_title": "File:Transmission electron micrograph of Methanomassiliicoccus luminyensis B10T.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "archaeon", "title": "Methanomassiliicoccus by TEM", "caption": "Transmission electron micrograph of a thin section through a cell of the methanogenic archaeon Methanomassiliicoccus luminyensis, with membrane compartments labelled."},
    # Public domain, Mark Amend (NOAA)
    {"commons_title": "File:Thermophile archaea C Pyrolobus fumarii.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "archaeon", "title": "Pyrolobus fumarii by TEM", "caption": "Thin-section transmission electron micrograph of Pyrolobus fumarii, a heat-loving archaeon isolated from deep-sea vent fluid."},
    # CC BY-SA 4.0, Andythearchaea
    {"commons_title": "File:V. distributa.tif", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "archaeon", "title": "Vulcanisaeta rods by SEM", "caption": "Scanning electron micrograph of rod-shaped Vulcanisaeta distributa cells alongside mineral deposits (likely iron sulfide) formed during growth."},
    # CC BY 4.0, Servé Kengen
    {"commons_title": "File:Coloured-scanning-electron-micrograph-of-Pyrococcus-furiosus-cells-Photograph-ANP.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "archaeon", "title": "Pyrococcus furiosus by SEM", "caption": "Coloured scanning electron micrograph of round Pyrococcus furiosus cells joined by a network of flagella stuck to a surface."},
    # CC0, Cboerner
    {"commons_title": "File:Saccharomyces cerevisiae Loeffler's Methylene Blue Staining.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "yeast", "title": "Baker's yeast, methylene blue", "caption": "Saccharomyces cerevisiae cells stained with Loeffler's methylene blue and viewed at 400x on a compound microscope."},
    # Public domain, Masur
    {"commons_title": "File:Shmoo yeast S cerevisiae.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "yeast", "title": "Mating yeast shmoo, DIC", "caption": "A mating-type a yeast cell forming a 'shmoo' projection after exposure to alpha factor, imaged with DIC through a 100x/1.40 oil objective."},
    # CC BY 2.5, Masur
    {"commons_title": "File:Yeast membrane proteins.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "yeast", "title": "Yeast membranes in RFP and GFP", "caption": "Fluorescence image of S. cerevisiae cells whose plasma membranes are outlined by membrane proteins fused to RFP and GFP; overlap appears yellow."},
    # CC BY 4.0, Tgru001
    {"commons_title": "File:Yeast frozen flow.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "yeast", "title": "Freeze-fractured yeast", "caption": "Platinum replica of freeze-fractured baker's yeast showing the cell wall surface with two large bud scars; replicas like this are imaged in the electron microscope."},
    # CC BY-SA 3.0, Djspring
    {"commons_title": "File:C tropicalis YC466.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "yeast", "title": "Candida tropicalis by SEM", "caption": "Pseudo-coloured scanning electron micrograph of Candida tropicalis showing oval yeast cells together with elongated pseudohyphae."},
    # CC BY 4.0, G Lens Microscopist, Liam Pennington
    {"commons_title": "File:Fission yeast division.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "yeast", "title": "Fission yeast dividing", "caption": "Confocal fluorescence images of rod-shaped fission yeast cells stained with calcofluor white, showing the septum forming as a cell divides."},
    # CC BY 4.0, Schvarcz CR, Wilson ST et al.
    {"commons_title": "File:41467 2022 28065 Fig1a.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "diatom", "title": "Epithemia valve by SEM", "caption": "Scanning electron micrograph of the curved silica valve of the marine diatom Epithemia pelagica; scale bar 5 um."},
    # CC BY-SA 4.0, Djpmapfer
    {"commons_title": "File:Naviculoid diatom.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "diatom", "title": "Living naviculoid diatoms, DIC", "caption": "Two living boat-shaped diatoms in Nomarski DIC, showing the raphe along the midline, golden plastids near the edges and a central nucleus."},
    # CC BY-SA 4.0, Anatoly Mikhaltsov
    {"commons_title": "File:Диатомовая водоросль Gyrosigma acuminatum.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "diatom", "title": "Gyrosigma acuminatum, live", "caption": "A living sigmoid diatom, Gyrosigma acuminatum, in DIC: the golden-brown chloroplast and central nucleus show through the clear silica frustule."},
    # CC BY-SA 3.0 DE, Frank Fox
    {"commons_title": "File:Mikrofoto.de-Pleurosigma angulatum-2.jpg", "kind": "micrograph", "system": "", "techniques": ["darkfield"], "cell_type": "diatom", "title": "Pleurosigma in darkfield", "caption": "Frustules of the diatom Pleurosigma angulatum glowing against a black background under darkfield illumination."},
    # CC BY-SA 4.0, Luca Santangeli (EMBL)
    {"commons_title": "File:Diatom chain.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "diatom", "title": "Thalassiosira chain, confocal", "caption": "Confocal image of a chain-forming Thalassiosira diatom colony collected off the Antarctic Peninsula by the Tara Oceans expedition."},
    # CC BY 3.0, Alexandra Kraberg (AWI)
    {"commons_title": "File:Alexandra hemi memb1 ps95 011 20m 20160216134412 hc.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "diatom", "title": "Hemiaulus membranaceus", "caption": "Light micrograph of a formalin-fixed cell of the centric diatom Hemiaulus membranaceus from an Atlantic plankton net haul."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Инфузория туфелька.tif", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "ciliate", "title": "Paramecium caudatum, DIC", "caption": "The slipper-shaped ciliate Paramecium caudatum with its food vacuoles, imaged by differential interference contrast."},
    # CC BY-SA 4.0, Fritzmann2002
    {"commons_title": "File:Stentor (Light Microscope).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "ciliate", "title": "Stentor, light microscope", "caption": "The trumpet-shaped ciliate Stentor seen through a light microscope."},
    # CC BY 2.0, Picturepest
    {"commons_title": "File:Euplotes - 160x - Dunkelfeld (8356971373).jpg", "kind": "micrograph", "system": "", "techniques": ["darkfield"], "cell_type": "ciliate", "title": "Euplotes in darkfield", "caption": "The flattened ciliate Euplotes at 160x under darkfield illumination, standing out bright against a dark background."},
    # CC BY 2.0, Picturepest
    {"commons_title": "File:Euplotes - 250x - Phako (8491640089).jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "ciliate", "title": "Euplotes, phase contrast", "caption": "The flattened ciliate Euplotes photographed at 250x in phase contrast."},
    # CC BY 4.0, NBojanic
    {"commons_title": "File:Codonellopsis schabi (Brandt, 1906) Kofoid and Campbell, 1929.tif", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "ciliate", "title": "Tintinnid ciliate by SEM", "caption": "Scanning electron micrograph of the vase-shaped lorica of the tintinnid ciliate Codonellopsis schabi from the Adriatic Sea."},
    # CC BY-SA 4.0, ValeSer23
    {"commons_title": "File:NDG2 Euplotes woodruffi.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "ciliate", "title": "Euplotes nuclei, DAPI", "caption": "Euplotes woodruffi stained with DAPI and viewed by fluorescence at 40x: the T-shaped macronucleus, the small micronucleus and symbiotic bacteria light up."},
    # CC BY 4.0, Lorenzo-Morales J, Khan NA, Walochnik J
    {"commons_title": "File:Parasite140120-fig3 Acanthamoeba keratitis Figure 3A.png", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "amoeba", "title": "Acanthamoeba, phase contrast", "caption": "Acanthamoeba trophozoite with its spiky acanthopodia, seen in phase contrast; scale bar 10 um."},
    # CC BY 4.0, AmoeboidProtist
    {"commons_title": "File:Korotnevella hortobotanici.tif", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "amoeba", "title": "Korotnevella, moving amoeba", "caption": "A naked lobose amoeba, Korotnevella hortobotanici, in its moving form, imaged in phase contrast."},
    # Public domain, CDC/Janice Haney Carr
    {"commons_title": "File:Hartmannella vermiformis.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "amoeba", "title": "Hartmannella amoebae by SEM", "caption": "Scanning electron micrograph (about 5000x) of a small group of Hartmannella (now Vermamoeba) vermiformis trophozoites."},
    # CC BY-SA 4.0, Brandon Antonio Segura Torres & Priscilla Vieto
    {"commons_title": "File:Tecameba del género Arcella hallado en la Selva lacandona SEM.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "amoeba", "title": "Arcella shell by SEM", "caption": "Scanning electron micrograph of the round shell (test) of an Arcella testate amoeba from the Lacandon Jungle, Mexico."},
    # CC BY-SA 4.0, Brandon Antonio Segura Torres & Priscilla Vieto
    {"commons_title": "File:Tecameba del género Arcella vista con luz polarizada.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "amoeba", "title": "Arcella in polarized light", "caption": "An Arcella testate amoeba viewed under polarized light."},
    # Public domain, CDC/Dr. Govinda S. Visvesvara
    {"commons_title": "File:Méningo-encéphalite amibienne primitive.JPG", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "amoeba", "title": "Naegleria in brain tissue", "caption": "Naegleria fowleri amoebae in brain tissue from a case of amoebic meningoencephalitis, picked out in green by a direct fluorescent antibody stain."},
    # CC BY 4.0, Lilyviolet
    {"commons_title": "File:Anacharis Magnified.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "plant-cell", "title": "Elodea leaf cells, 400x", "caption": "Brick-shaped cells of an Elodea (anacharis) leaf at 400x, with cell walls and green chloroplasts visible, photographed in a school biology class."},
    # CC BY-SA 4.0, Yuliya Krasylenko
    {"commons_title": "File:Cortical microtubules in epidermal cells of Arabidopsis thaliana (GFP-MBD) hypocotyls.Live cell imaging confocal microscopy.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "plant-cell", "title": "Arabidopsis microtubules, confocal", "caption": "Live confocal image of the cortical microtubule network in hypocotyl epidermal cells of Arabidopsis seedlings expressing GFP-MBD."},
    # CC BY-SA 3.0, Mnolf
    {"commons_title": "File:Rhoeo Discolor - Plasmolysis.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "plant-cell", "title": "Plasmolysed epidermal cells", "caption": "Rhoeo (Tradescantia) epidermis cells after plasmolysis: the pink vacuoles have shrunk away from the cell walls; field of view about 450 um."},
    # CC BY 4.0, MarekMiś
    {"commons_title": "File:Skrobia ziemniaczana.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "plant-cell", "title": "Potato cells with starch", "caption": "Raw potato tissue at 100x under polarized light, with the cells packed with starch grains."},
    # CC BY-SA 4.0, Plantsurfer
    {"commons_title": "File:Epidermis of Festuca arundinacea.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "plant-cell", "title": "Grass leaf epidermis by SEM", "caption": "Scanning electron micrograph of the leaf epidermis of tall fescue grass (Festuca arundinacea), showing rows of elongated epidermal cells."},
    # CC BY-SA 3.0, Kristian Peters
    {"commons_title": "File:Plagiomnium elatum lamina.jpeg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "plant-cell", "title": "Moss leaf cells", "caption": "Leaf lamina cells of the moss Plagiomnium elatum at about 400x, each filled with chloroplasts."},
    # CC BY 2.5, Alex Costa
    {"commons_title": "File:Plant stoma guard cells.png", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "guard-cell", "title": "Arabidopsis guard cells, confocal", "caption": "Confocal image of an Arabidopsis stoma: the two guard cells show GFP fluorescence (green) and chloroplast autofluorescence (red)."},
    # CC BY 4.0, Sharadch
    {"commons_title": "File:A stoma on croton leaf.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "guard-cell", "title": "Croton stoma at 1000x", "caption": "A stoma flanked by its two guard cells on a croton leaf, photographed on a compound light microscope at 1000x."},
    # CC0, Arlo James Barnes
    {"commons_title": "File:Stoma.tif", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "guard-cell", "title": "Leaf stoma by SEM", "caption": "Scanning electron micrograph of a single stoma, the guard-cell-bounded pore in a leaf surface."},
    # CC BY-SA 3.0, Vivian Vislap and Tõnu Järveots
    {"commons_title": "File:Abaxial side.tif", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "guard-cell", "title": "Birch leaf stomata by SEM", "caption": "Scanning electron micrograph of the underside of a silver birch leaf, with stomata scattered among cuticle-covered epidermal cells."},
    # CC BY-SA 3.0, Charles Tschirhart
    {"commons_title": "File:Stoma with Accompanying Guard Cells.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "guard-cell", "title": "Bok choy stoma close-up", "caption": "Electron micrograph close-up of a stoma and its paired guard cells on a bok choy (Brassica chinensis) leaf."},
    # CC BY-SA 4.0, ConformationXII
    {"commons_title": "File:Aloe vera Cells with Stoma, 600X.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "guard-cell", "title": "Aloe vera stoma, ink stain", "caption": "Lower epidermis of Aloe vera at 600x in brightfield, stained with fountain-pen ink, showing a stoma with its guard cells among epidermal cells."},
    # CC BY 4.0, Trương Minh Khải
    {"commons_title": "File:Stomata of Tradescantia spathacea leaves.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "guard-cell", "title": "Tradescantia spathacea stomata", "caption": "Stomata among the purple-tinted epidermal cells of a Tradescantia spathacea leaf, viewed through a light microscope at 400x."},
    # CC BY-SA 4.0, Elatadi
    {"commons_title": "File:Flower pollen 01.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "pollen", "title": "Lily pollen in water", "caption": "Lily pollen grains suspended in water and viewed under a light microscope."},
    # CC BY-SA 4.0, Wanderfee11
    {"commons_title": "File:Betula pollen 400x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "pollen", "title": "Birch pollen, 400x", "caption": "Birch (Betula) pollen grains under a light microscope at 400x."},
    # CC BY-SA 4.0, Wanderfee11
    {"commons_title": "File:Larix sp Pollen 400x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "pollen", "title": "Larch pollen, 400x", "caption": "Large rounded pollen grains of larch (Larix) under a light microscope at 400x."},
    # CC BY-SA 4.0, Wanderfee11
    {"commons_title": "File:Cucurbita peppo Pollen 400x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "pollen", "title": "Squash pollen surface, 400x", "caption": "Part of a very large, spiny pollen grain of squash (Cucurbita pepo) seen under a light microscope at 400x."},
    # CC BY-SA 4.0, Asja Radja
    {"commons_title": "File:Passiflora Pollen Grains.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "pollen", "title": "Passionflower pollen by SEM", "caption": "False-coloured scanning electron micrograph of passionflower (Passiflora) pollen grains with their reticulate surface pattern."},
    # CC BY-SA 4.0, ToniVakiparta
    {"commons_title": "File:LUT SEM Alder pollen 3kx.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "pollen", "title": "Alder pollen by SEM", "caption": "Scanning electron micrograph at 3000x of an alder pollen grain collected on a university campus."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Red blood cells by darkfield microscopy.jpg", "kind": "micrograph", "system": "", "techniques": ["darkfield"], "cell_type": "erythrocyte", "title": "Red blood cells in darkfield", "caption": "Human red blood cells seen by darkfield microscopy at about 1000x; each cell shows as a bright ring against a black background."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Normocyte.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "erythrocyte", "title": "Normal red blood cell, Giemsa", "caption": "A normal-sized red blood cell (normocyte) in a Giemsa-stained blood smear, with its pale central zone."},
    # Public domain, Rick Fairhurst and Jordan Zuspann, National Institute of Allergy and Infectious Diseases,
    {"commons_title": "File:Red blood cells infected with malaria.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "erythrocyte", "title": "Malaria-infected red cell, SEM", "caption": "Scanning electron micrograph of a red blood cell infected with Plasmodium falciparum, its surface covered in parasite 'knobs', among smooth uninfected cells."},
    # CC BY-SA 4.0, Geekiyanage NM, Balanant MA, Sauret E, Saha S, Flower R, Lim CT, et al.
    {"commons_title": "File:Scanning electron microscope (SEM) image of a RBC population having different morphology stages of stomatocytosis and echinocytosis.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "erythrocyte", "title": "Red cell shapes in SEM", "caption": "Scanning electron micrograph of a population of red blood cells at different stages of shape change, from cup-shaped stomatocytes to spiky echinocytes."},
    # CC BY 4.0, Bobjgalindo
    {"commons_title": "File:A blood smear of rainbow trout.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "erythrocyte", "title": "Rainbow trout blood smear", "caption": "Stained blood smear from a rainbow trout: unlike mammalian red cells, fish erythrocytes are oval and keep their nucleus."},
    # CC BY-SA 4.0, Karlina28
    {"commons_title": "File:Rhjdm1.PNG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "erythrocyte", "title": "Unstained human red cells", "caption": "Unstained human red blood cells under an ordinary light microscope (40x objective)."},
    # CC BY-SA 2.0, Hanna Sörensson from Karlstad, Sweden
    {"commons_title": "File:Segmented neutrophil (16508611940).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neutrophil", "title": "Segmented neutrophil, MGG", "caption": "A mature neutrophil with a lobed (segmented) nucleus among red cells in a May-Grünwald-Giemsa stained blood smear."},
    # Public domain, National Institutes of Health (NIH)
    {"commons_title": "File:Human neutrophil ingesting MRSA.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "neutrophil", "title": "Neutrophil engulfing MRSA, SEM", "caption": "Scanning electron micrograph of a human neutrophil engulfing methicillin-resistant Staphylococcus aureus bacteria."},
    # CC BY-SA 3.0, Simon Caulton
    {"commons_title": "File:P ANCA.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "neutrophil", "title": "Neutrophils in immunofluorescence", "caption": "Ethanol-fixed human neutrophils labelled by patient serum and a FITC conjugate, showing the perinuclear (p-ANCA) fluorescence pattern of anti-MPO antibodies."},
    # Public domain, CDC/ James Volk
    {"commons_title": "File:Neutrophils phagocytizing bacteria.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neutrophil", "title": "Neutrophils with ingested bacteria", "caption": "Light micrograph (about 1125x) of a stained urethral exudate in which neutrophils contain paired gonococcal diplococci."},
    # CC BY-SA 4.0, Animalculist
    {"commons_title": "File:Neutrophils with segmented nuclei.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neutrophil", "title": "Neutrophils in a blood smear", "caption": "Neutrophils with segmented nuclei among red blood cells in a stained human blood smear."},
    # CC BY-SA 4.0, Department of Pathology, Calicut Medical College
    {"commons_title": "File:Lung biopsy showing lobar pneumonia 40X.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neutrophil", "title": "Neutrophils filling lung alveoli", "caption": "H&E-stained lung tissue in lobar pneumonia: the alveolar spaces are packed with neutrophils."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Lymphocytes.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Lymphocytes, Giemsa", "caption": "Lymphocytes in a Giemsa-stained smear of human peripheral blood, with a large round nucleus and a thin rim of cytoplasm."},
    # CC BY-SA 4.0, Makysm
    {"commons_title": "File:Lymphocyte in blood.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Lymphocyte, Romanowsky stain", "caption": "A lymphocyte among red blood cells in a Romanowsky-stained blood smear photographed at 1000x."},
    # Public domain, Unknown photographer/artist
    {"commons_title": "File:SEM Lymphocyte.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "lymphocyte", "title": "Human lymphocyte, SEM", "caption": "Scanning electron micrograph of a single human lymphocyte, its surface covered in short microvilli (false-coloured)."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Blood-lymphocytes2.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Two lymphocytes, Wright stain", "caption": "Two lymphocytes among red blood cells in a Wright-stained blood smear."},
    # CC BY-SA 3.0, NicolasGrandjean
    {"commons_title": "File:Lymphocyte2.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Lymphocyte, MGG at 1000x", "caption": "A lymphocyte from normal human blood, May-Grünwald-Giemsa stain, photographed at 1000x."},
    # CC BY-SA 4.0, SpicyMilkBoy
    {"commons_title": "File:Reactive lymphocyte.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Reactive lymphocyte", "caption": "A reactive (activated) lymphocyte with abundant blue cytoplasm in a stained smear of human peripheral blood."},
    # CC BY-SA 2.0, Obli
    {"commons_title": "File:Macrophage.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "macrophage", "title": "Mouse macrophage reaching out", "caption": "Light micrograph of a mouse macrophage extending two processes toward small particles it is about to engulf."},
    # CC BY 2.0, NIAID
    {"commons_title": "File:Macrophage (17195150690).jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "macrophage", "title": "Macrophage, coloured SEM", "caption": "Colourised scanning electron micrograph of a macrophage spreading on a surface with long thin processes."},
    # CC0, Mikael Häggström, M.D.
    {"commons_title": "File:Gram stain of a macrophage with ingested S epidermidis bacteria.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "macrophage", "title": "Macrophage with ingested bacteria", "caption": "Gram-stained tissue section showing a macrophage whose cytoplasm holds purple Staphylococcus epidermidis bacteria, within an endocarditis vegetation."},
    # CC BY-SA 4.0, Department of Pathology, Calicut Medical College
    {"commons_title": "File:Hemosiderin laden macrophages in chronic venous congestion of lung 40X.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "macrophage", "title": "Hemosiderin-laden lung macrophages", "caption": "H&E-stained lung with alveolar macrophages full of brown hemosiderin pigment, from chronic venous congestion."},
    # CC BY 2.5, Inman M
    {"commons_title": "File:ADP ribosylation factor localization in the Golgi apparatus of a living macrophage.png", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "macrophage", "title": "Living macrophage, fluorescent ARF", "caption": "Fluorescence image of a living macrophage in which a labelled ARF GTPase marks the Golgi apparatus."},
    # Public domain, Louisa Howard
    {"commons_title": "File:Macrophage in the alveolus Lung - TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "macrophage", "title": "Alveolar macrophage, TEM", "caption": "Transmission electron micrograph of a thin section of mammalian lung showing an alveolar macrophage with its nucleus, Golgi and mitochondria."},
    # Public domain, Louisa Howard
    {"commons_title": "File:Eosinophil TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "eosinophil", "title": "Eosinophil, TEM", "caption": "Transmission electron micrograph of a human eosinophil; its large granules have dense crystalloid cores."},
    # CC0, Mikael Häggström, M.D.
    {"commons_title": "File:Histology of an eosinophil in esophageal epithelium.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophil in esophageal lining", "caption": "H&E-stained section showing an eosinophil with a bilobed nucleus inside the squamous epithelium of the esophagus."},
    # CC BY-SA 4.0, Animalculist
    {"commons_title": "File:Eosinophils in bone marrow.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophils in bone marrow", "caption": "Giemsa-stained bone marrow with eosinophils at several stages of maturation, recognisable by orange granules."},
    # CC BY 4.0, Albert Sek
    {"commons_title": "File:2017 1101 HorseEos 40x 6-crop-wiki2.tif", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Horse eosinophils", "caption": "Eosinophils isolated from horse blood by density centrifugation and stained with modified Wright-Giemsa, imaged with a 40x oil objective."},
    # CC BY-SA 4.0, Department of Pathology, Calicut Medical College
    {"commons_title": "File:Eosinophils HP view.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophils in tissue, H&E", "caption": "High-power H&E micrograph of tissue infiltrated by eosinophils with bright pink granular cytoplasm."},
    # CC BY-SA 4.0, Vitor Neves
    {"commons_title": "File:Eosinófilo.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophil in human blood", "caption": "A human blood eosinophil with a bilobed nucleus and orange-red granules in a stained blood smear."},
    # CC BY 3.0, Tleonardi
    {"commons_title": "File:Platelets.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Platelet clump, MGG", "caption": "A clump of platelets in a May-Grünwald-Giemsa stained blood smear, viewed with a 100x oil-immersion objective."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Platelets2.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Platelets in a blood film", "caption": "Small purple platelets scattered between red blood cells in a Giemsa-stained blood film."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Giant platelets in ITP.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Giant platelets", "caption": "Unusually large platelets among red cells in a stained blood smear from a person with immune thrombocytopenia."},
    # CC BY-SA 4.0, Animalculist
    {"commons_title": "File:Atypical platelets.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Elongated atypical platelets", "caption": "Long, atypical platelets among red cells in a stained blood smear, possibly linked to an ACTN1 mutation."},
    # CC BY-SA 3.0, Erhabor Osaro (Associate Professor)
    {"commons_title": "File:Thrombocytosis.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Many platelets (thrombocytosis)", "caption": "Stained blood smear with an abnormally high number of platelets scattered between the red cells."},
    # CC0, Lennart Rikk
    {"commons_title": "File:Neurons (Purkinje cells).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neuron", "title": "Purkinje cells, dog cerebellum", "caption": "Light micrograph of a dog's cerebellum showing pear-shaped Purkinje neurons with dendrites branching into the molecular layer."},
    # CC BY-SA 4.0, Tulemo
    {"commons_title": "File:Nissl bodies in neurons of the spinal cord.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neuron", "title": "Motor neurons with Nissl bodies", "caption": "Anterior horn neurons of the spinal cord stained with cresyl violet for Nissl bodies, among axons stained blue with luxol fast blue."},
    # Public domain, Sbrandner
    {"commons_title": "File:Cerebellum PurkinjeCells.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "neuron", "title": "Purkinje cells, laser scanning", "caption": "Laser scanning micrograph of mouse cerebellum with Purkinje cells labelled for calbindin (green), basket cells for neurofilament (red) and nuclei with DAPI (blue)."},
    # CC BY-SA 4.0, Tulemo
    {"commons_title": "File:Cholinergic neurons of the nucleus basalis of Meynert.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neuron", "title": "Cholinergic neurons, monkey", "caption": "Brown immunohistochemical staining for choline acetyltransferase marks cholinergic neurons in the basal forebrain of a rhesus monkey."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Spindle neurons - very high mag - cropped.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neuron", "title": "Von Economo spindle neurons", "caption": "LFB-HE stained section of the cingulate cortex showing elongated spindle (von Economo) neurons at very high magnification."},
    # CC BY 4.0, J. Wegiel
    {"commons_title": "File:Microglial cells.tif", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "glial-cell", "title": "Microglia, Iba1 immunofluorescence", "caption": "Immunofluorescence image of microglial cells labelled with an antibody to IBA1 (red), with DNA in blue."},
    # CC BY-SA 4.0, GerryShaw
    {"commons_title": "File:Microglial cells (red) in rat cerebellar molecular layer.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "glial-cell", "title": "Microglia and Bergmann glia", "caption": "Rat cerebellar molecular layer with microglia labelled for IBA-1 (red), Bergmann glia for GFAP (green) and nuclei with DAPI (blue)."},
    # CC BY-SA 3.0, GerryShaw
    {"commons_title": "File:Astrocyte5.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "glial-cell", "title": "Cultured astrocyte, confocal", "caption": "Confocal image of a cultured astrocyte stained for GFAP (red) and vimentin (green), which overlap to yellow, with DAPI-stained nuclei."},
    # CC BY-SA 4.0, Pics56
    {"commons_title": "File:Astrocytes surrounding amyloid plaques II.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "glial-cell", "title": "Reactive astrocytes around plaques", "caption": "Confocal image of activated astrocytes (white) clustering around amyloid plaques (magenta) in the cortex of a mouse model of Alzheimer's disease."},
    # Public domain, Louisa Howard
    {"commons_title": "File:Human skeletal muscle tissue 3 - TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "skeletal-muscle", "title": "Sarcomeres, TEM", "caption": "Transmission electron micrograph of a longitudinal section of human skeletal muscle showing A bands, I bands, Z lines and paired mitochondria."},
    # Public domain, Louisa Howard
    {"commons_title": "File:Human skeletal muscle tissue 1 - TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "skeletal-muscle", "title": "Myofibrils, TEM", "caption": "Transmission electron micrograph of human skeletal muscle in longitudinal section, with several myofibrils showing the repeating sarcomere bands."},
    # CC BY 4.0, Giolicc
    {"commons_title": "File:Electronic microscopy picture of a muscle.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "skeletal-muscle", "title": "Muscle banding, TEM", "caption": "Transmission electron micrograph of skeletal muscle in which the actin and myosin bands of the sarcomeres are clearly visible."},
    # Public domain, NASA Johnson Space Center
    {"commons_title": "File:Myogenesis - ISRO (jsc2025e039327).jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "skeletal-muscle", "title": "Human myotubes, immunofluorescence", "caption": "Immunofluorescence of multinucleated human myotubes grown from skeletal muscle stem cells, with myosin heavy chain in red and nuclei in blue."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Skeletal striated muscle.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "skeletal-muscle", "title": "Skeletal muscle, HPS stain", "caption": "Longitudinal section of human skeletal muscle (fibularis longus) stained with HPS, showing long striated fibres with peripheral nuclei."},
    # CC BY-SA 4.0, Ps1415
    {"commons_title": "File:F-actin filaments in cardiomyocytes.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cardiomyocyte", "title": "Cardiomyocytes, F-actin stain", "caption": "Fluorescence staining of F-actin filaments (green) and nuclei (blue) in cultured neonatal cardiomyocytes."},
    # CC BY-SA 4.0, Evgeniy Ukraine
    {"commons_title": "File:Peroxisome in rat neonatal cardiomyocyte.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cardiomyocyte", "title": "Peroxisomes in a cardiomyocyte", "caption": "Neonatal rat cardiomyocyte with peroxisomes labelled by an Alexa Fluor 488 antibody kit against the peroxisomal membrane protein PMP70."},
    # CC BY-SA 3.0, Andrea Mazza
    {"commons_title": "File:Cardiac muscle07.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle, iron hematoxylin", "caption": "Cardiac muscle stained with iron hematoxylin and viewed at 400x, showing branching striated fibres."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Muscle Tissue Cardiac Muscle (27187637147).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle cross section", "caption": "Stained cross section of cardiac muscle at 100x magnification."},
    # CC BY-SA 4.0, Alessandro Scalese
    {"commons_title": "File:Cardiac Muscle.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle, Mallory trichrome", "caption": "Cardiac muscle stained with Mallory's trichrome, photographed through the microscope eyepiece."},
    # CC BY-SA 4.0, Alexander G. Cheroske
    {"commons_title": "File:Cardiac muscle histology 400x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle at 400x", "caption": "Stained section of cardiac muscle seen with a light microscope at 400x, with branching fibres and central nuclei."},
    # CC BY-SA 3.0, Rollroboter
    {"commons_title": "File:Muskel glatt 1.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle, Masson-Goldner", "caption": "Light micrograph of longitudinally sectioned smooth muscle stained with Masson-Goldner trichrome, showing spindle-shaped cells."},
    # Public domain, National Institutes of Health (NIH)
    {"commons_title": "File:Embryonic smooth muscle cell.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "smooth-muscle", "title": "Embryonic smooth muscle cell, confocal", "caption": "Laser scanning confocal image of an embryonic smooth muscle cell with its actin cytoskeleton (green) and vinculin at cell adhesions (blue)."},
    # CC BY-SA 4.0, Juan Carlos Fonseca Mata
    {"commons_title": "File:Smooth muscle (histology slide).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle histology slide", "caption": "Stained histology slide of smooth muscle with elongated cells and cigar-shaped nuclei."},
    # CC BY-SA 4.0, Juan Carlos Fonseca Mata
    {"commons_title": "File:Smooth muscle - histology.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle tissue section", "caption": "Stained histological section of smooth muscle tissue."},
    # CC BY-SA 4.0, CoRus13
    {"commons_title": "File:Colonic leiomyoma (SMA), very high mag.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle actin immunostain", "caption": "Colonic leiomyoma, a benign smooth muscle tumour, with its cells stained brown by immunohistochemistry for smooth muscle actin."},
    # CC BY-SA 3.0, Mulletsrokk
    {"commons_title": "File:Cheekcells stained.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Stained cheek cells at 500x", "caption": "Stained cells scraped from the inside of the cheek, a non-keratinized stratified squamous epithelium, photographed through a light microscope at 500x: flat polygonal cells, each with a small central nucleus."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Буккальный эпителий 1.tif", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "squamous-epithelium", "title": "Buccal cells, acridine orange", "caption": "Fluorescence micrograph of a mouth smear stained with acridine orange (100x objective): flat buccal epithelial cells dotted with bacteria."},
    # CC BY 4.0, Bondarev.gal
    {"commons_title": "File:Buccal Epithelium Cells.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Buccal epithelium, phenol red stain", "caption": "Smear from the mouth stained with phenolsulfonphthalein (phenol red) and imaged with a 50x objective: large flat buccal epithelial cells covered with bacteria."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Stratified Squamous Epithelium (41994232802).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Stratified squamous epithelium, 400x", "caption": "Teaching-slide cross section of stratified squamous epithelium at 400x, showing layers of cells that flatten toward the surface."},
    # CC BY-SA 4.0, Department of Pathology, Calicut Medical College
    {"commons_title": "File:Normal PAP (Cervical) Smear.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Normal cervical Pap smear", "caption": "Papanicolaou-stained cervical smear at 400x: polygonal superficial squamous cells (pink, eosinophilic) mixed with intermediate squamous cells (blue, basophilic)."},
    # CC BY-SA 3.0, Nva1991
    {"commons_title": "File:Thuc quan.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Esophagus lining", "caption": "Histological section of the esophagus, whose lining is a stratified squamous epithelium of flattened cells over a connective-tissue layer."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Simple Columnar Epithelium (27854453338).jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "columnar-epithelium", "title": "Gut columnar epithelium, phase contrast", "caption": "Cross section of mammalian gut viewed by phase contrast at 400x, showing the tall simple columnar cells that line the intestine."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Mucous Glands in Simple Columnar Epithelium (27854454278).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Goblet cells in gut epithelium", "caption": "Mammalian gut cross section at 400x: simple columnar epithelium with mucus-secreting goblet cells between the absorptive cells."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Simple Columnar Epithelium (27854452128).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Simple columnar epithelium, 200x", "caption": "Teaching-slide cross section of mammalian gut at 200x, with a single layer of tall columnar cells covering the mucosa."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Simple Columnar Epithelium (40824137585).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Gut mucosa at low power", "caption": "Lower-magnification (100x) cross section of mammalian gut, showing how the simple columnar epithelium follows the folds of the mucosa."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Epith simple columnar1.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Simple columnar epithelium", "caption": "Stained human tissue section showing simple columnar epithelium: one layer of tall cells with elongated nuclei near the base."},
    # CC BY 4.0, Ca.garcia.s
    {"commons_title": "File:Fibroblastos 100x b.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "fibroblast", "title": "Cultured fibroblasts, phase contrast", "caption": "Tissue-cultured fibroblasts at 100x seen through an inverted phase-contrast microscope: elongated spindle-shaped cells."},
    # CC BY 4.0, Lorenzo2697
    {"commons_title": "File:Actin filaments of cardiac fibroblasts.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "fibroblast", "title": "Actin in cardiac fibroblasts", "caption": "Fluorescence micrograph of cardiac fibroblasts stained for actin filaments; each red shape is one fibroblast."},
    # CC BY-SA 4.0, TEHb K0CM0CA
    {"commons_title": "File:1 Alien Planet Surface.tif", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "fibroblast", "title": "Mouse fibroblasts, DIC", "caption": "Differential interference contrast (DIC) image of mouse fibroblasts, whose nuclei and cytoplasm appear in shaded relief."},
    # CC BY-SA 4.0, TEHb K0CM0CA
    {"commons_title": "File:Double Star Satellite FLU.tif", "kind": "micrograph", "system": "", "techniques": ["sim"], "cell_type": "fibroblast", "title": "Fibroblasts with EB3-RFP (SIM)", "caption": "Structured illumination microscopy (SIM) of mouse fibroblasts transfected with EB3-RFP, which marks growing microtubule ends, shown in a green lookup table."},
    # CC BY 2.5, SubtleGuest
    {"commons_title": "File:Fibroblast.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "fibroblast", "title": "NIH/3T3 fibroblasts, phase contrast", "caption": "Mouse fibroblasts photographed by phase-contrast microscopy on an inverted microscope, showing their long tapering processes."},
    # CC BY-SA 3.0, Y tambe
    {"commons_title": "File:HeLa cells.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "cultured-cell-line", "title": "HeLa cells, phase contrast 100x", "caption": "Phase-contrast image of a HeLa cell culture at 100x, taken through a green filter."},
    # Public domain, User:Alcibiades
    {"commons_title": "File:Cho cells adherend1.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "cultured-cell-line", "title": "Adherent CHO cells", "caption": "Chinese hamster ovary (CHO) cells attached to the bottom of a culture flask, viewed by phase contrast."},
    # CC BY 2.0, Joseph Elsbernd
    {"commons_title": "File:COS-7 Cells - 40X Magnification - Confocal Microscopy.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "cultured-cell-line", "title": "COS-7 cells, confocal", "caption": "COS-7 cells, a monkey kidney-derived cell line, imaged at 40x on a Fluoview confocal microscope."},
    # CC0, Bioguy10
    {"commons_title": "File:Fluorescence.microscope2.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cultured-cell-line", "title": "COS-7 actin, phalloidin-FITC", "caption": "COS-7 culture stained with phalloidin-FITC, which binds actin in the cytoskeleton and glows bright green under a fluorescence microscope."},
    # CC BY 2.0, ZEISS Microscopy from Germany
    {"commons_title": "File:HeLa-Kyoto cells from a 72h cell growth assay using ZEISS Celldiscoverer 7 with Autoimmersion (30614936882).jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cultured-cell-line", "title": "HeLa Kyoto H2B-mCherry / tubulin-GFP", "caption": "HeLa Kyoto cells expressing H2B-mCherry and tubulin-eGFP from a 72-hour live growth assay; red and green fluorescence are overlaid on a phase-gradient contrast image."},
    # CC BY-SA 4.0, Ivo Kruusamägi
    {"commons_title": "File:PDNA transfer via PepFect14.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "cultured-cell-line", "title": "CHO cell nucleus and mitochondria (TEM)", "caption": "Transmission electron micrograph of a CHO cell after plasmid DNA delivery with a cell-penetrating peptide; silver-enhanced nanogold marks the DNA, and mitochondria lie to the right of the nucleus."},
    # CC BY-SA 3.0, Dr. Roshan Nasimudeen
    {"commons_title": "File:Keratinocytes in spinous layer of epidermis.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "keratinocyte", "title": "Keratinocytes of the spinous layer", "caption": "Light micrograph of the spinous layer of the epidermis; edema between the keratinocytes makes their spine-like desmosomal connections easy to see."},
    # CC BY 4.0, Kaira Kriti, Azad Sheenam, Bisht Jeetendra S, Kumar Rajnish
    {"commons_title": "File:Civatte body.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "keratinocyte", "title": "Civatte body in epidermis", "caption": "Stained skin section with a Civatte body (arrow), a dead keratinocyte seen as a rounded pink body among the surrounding cells."},
    # CC BY 4.0, Hee Chul Lee, James Childs, Hye Jin Chung, Jinyoung Park, et al.
    {"commons_title": "File:Micrograph of perinuclear vacuolization of epidermal keratinocytes.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "keratinocyte", "title": "Vacuolated epidermal keratinocytes", "caption": "Stained skin section showing clear vacuoles around the nuclei of epidermal keratinocytes after laser treatment; an inset enlarges the affected cells."},
    # CC BY 4.0, Valerie R. Yanofsky, Stephen E. Mercer, and Robert G. Phelps
    {"commons_title": "File:Micrograph of early actinic keratosis.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "keratinocyte", "title": "Dysplastic keratinocytes (actinic keratosis)", "caption": "Skin section at 200x from an early actinic keratosis, in which abnormal keratinocytes are confined to the lower third of the epidermis."},
    # CC BY-SA 4.0, Rkott
    {"commons_title": "File:Adipocyte Lipid Droplet Staining Rkott 2023.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "adipocyte", "title": "Fly fat-body adipocytes (confocal)", "caption": "Immunofluorescence confocal image of adipocytes from the Drosophila fat body: lipid droplets in orange, cell membranes (alpha-spectrin) in blue and nuclei in cyan."},
    # CC BY-SA 4.0, Makysm
    {"commons_title": "File:Adipocytes.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "Adipocyte cluster, Giemsa", "caption": "A cluster of fat cells stained with Giemsa and viewed at 1000x, each cell largely filled by its lipid store."},
    # CC BY 2.0, Pazit Polak
    {"commons_title": "File:GFP in adipocyte (2263174384).jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "adipocyte", "title": "GFP-expressing 3T3-L1 adipocyte", "caption": "Fluorescence image of a 3T3-L1 cell differentiated into an adipocyte and expressing green fluorescent protein; the dark circles are lipid droplets."},
    # CC BY-SA 3.0, Ganímedes
    {"commons_title": "File:Tejido adiposo.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "Adipose tissue, H&E 400x", "caption": "Light micrograph of adipose tissue stained with hematoxylin and eosin at 400x: empty-looking fat cells whose lipid was dissolved during processing."},
    # CC BY-SA 4.0, Falty14
    {"commons_title": "File:Biele tukové väzivo, White adipose tissue.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "White adipose tissue (H&E)", "caption": "H&E-stained white adipose tissue, a honeycomb of large adipocytes separated by thin pink cell rims."},
    # CC BY-SA 3.0, Mjw.hanssen
    {"commons_title": "File:Bruin en wit vet.png", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "Brown and white fat cells", "caption": "Stained section where brown and white fat meet: brown fat cells hold many small lipid droplets, white fat cells a single large one."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Cartilage hyaline1.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Hyaline cartilage chondrocytes", "caption": "Stained section of human hyaline cartilage with chondrocytes sitting in lacunae within the glassy matrix."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Cartilage elastic1.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Elastic cartilage chondrocytes", "caption": "Stained elastic cartilage: chondrocytes in lacunae surrounded by a dense network of dark elastic fibres."},
    # Public domain, Robert M. Hunt
    {"commons_title": "File:Hypertrophic Zone of Epiphyseal Plate.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Hypertrophic chondrocytes, growth plate", "caption": "Light micrograph of an undecalcified epiphyseal growth plate, showing swollen hypertrophic chondrocytes passing through the maturation, degenerative and provisional calcification zones."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Connective Tissue Elastic Cartilage (41855666711).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Elastic cartilage at 400x", "caption": "Teaching-slide cross section of mammalian elastic cartilage at 400x with rounded chondrocytes in lacunae."},
    # CC BY-SA 3.0, Ganímedes
    {"commons_title": "File:Elastic cart 100X.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Elastic cartilage at 100x", "caption": "Elastic cartilage at 100x under a light microscope, showing rows of chondrocytes and the cartilage fibres around them."},
    # CC BY-SA 3.0, BioTek Instruments, Inc.
    {"commons_title": "File:BioTek-Wikipedia-Image.tif", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "chondrocyte", "title": "Chondrocyte spheroid, fluorescence", "caption": "Z-projected fluorescence image of a 3D spheroid of human mesenchymal stem cells differentiated into chondrocytes: Hoechst-stained nuclei, phalloidin-stained actin and collagen II."},
    # CC BY 4.0, Eclairereno
    {"commons_title": "File:Murine mandibular osteocyte.tif", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "osteocyte", "title": "Mouse jaw osteocyte (SEM)", "caption": "Scanning electron micrograph at 6000x of an osteocyte from mouse mandible, surrounded by a web of canaliculi."},
    # CC BY-SA 4.0, Woahbear
    {"commons_title": "File:Osteocyte.tif", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "osteocyte", "title": "Maturing osteocyte (TEM)", "caption": "Bright-field transmission electron micrograph of a maturing osteocyte lying above less differentiated osteoblastic cells."},
    # CC BY-SA 4.0, Woahbear
    {"commons_title": "File:STEM HAADF electron image of a maturing osteocyte near the bone surface, above a layer of osteoblast cells.tif", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "osteocyte", "title": "Osteocyte near bone surface (STEM)", "caption": "Scanning transmission electron (HAADF) image of a maturing osteocyte near the bone surface, above a layer of osteoblasts."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Connective Tissue Compact Bone (39978305670).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "osteocyte", "title": "Ground bone, osteocyte lacunae", "caption": "Ground section of human compact bone at 400x; the dark spaces arranged around the central canal are lacunae that held osteocytes."},
    # CC BY-SA 3.0, Andreas th
    {"commons_title": "File:Dünnschliff Rinderknochen Metatarsus pol.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "osteocyte", "title": "Bovine bone in polarised light", "caption": "Unstained ground section (~0.1 mm) of cow metatarsal bone in polarised light; vascular channels and osteocyte lacunae stand out against colours from aligned collagen and mineral."},
    # CC BY-SA 4.0, Alexquaas
    {"commons_title": "File:400x Diastase PAS liver AT1.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Hepatocytes, PAS-diastase stain", "caption": "Liver at 400x stained with diastase-PAS, highlighting alpha-1-antitrypsin globules inside hepatocytes."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Ground glass hepatocytes high mag cropped.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Ground-glass hepatocytes (H&E)", "caption": "H&E-stained liver biopsy at high magnification showing ground-glass hepatocytes of chronic hepatitis B, some containing brown lipofuscin granules."},
    # CC BY-SA 4.0, Annoni71
    {"commons_title": "File:Munch's hepatocyte.tif", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "hepatocyte", "title": "GFP-expressing hepatocyte", "caption": "Fluorescence image of a single hepatocyte expressing green fluorescent protein, its nucleus and nucleolus visible as dark holes."},
    # CC BY-SA 4.0, Aigaby
    {"commons_title": "File:Hepatocitos.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Hepatocyte cords", "caption": "Stained liver section of polyhedral hepatocytes arranged in cords; some cells have one nucleus and some two."},
    # CC BY-SA 3.0, Sanador2.0
    {"commons_title": "File:Hepatocito Mitocondrias.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Hepatocyte mitochondria, CAB stain", "caption": "Hepatocytes stained with chromotrope-aniline blue (CAB): large mitochondria appear red and the collagen around the cells blue."},
    # CC0, Mikael Häggström, M.D.
    {"commons_title": "File:Histopathology of a ballooning hepatocyte (original).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Ballooning hepatocyte (H&E)", "caption": "H&E-stained liver section with a swollen, pale ballooning hepatocyte, a sign of cell injury in steatohepatitis."},
    # CC BY-SA 4.0, Enver Kerem Dirican
    {"commons_title": "File:Human Spermatozoa, Scanning Electron Micrograph.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "sperm", "title": "Human sperm (SEM)", "caption": "Scanning electron micrograph of human spermatozoa showing the head, midpiece and tail in three dimensions."},
    # CC BY-SA 4.0, Ajay Kumar Chaurasiya
    {"commons_title": "File:Spermatozoa in Gram Stained Smear of Semen.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "sperm", "title": "Sperm in a Gram-stained smear", "caption": "Gram-stained semen smear (stated magnification 4000x) with numerous spermatozoa, their heads stained and tails trailing."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Сперматозоиды 4.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "sperm", "title": "Sperm in dried semen, DIC", "caption": "Differential interference contrast image of spermatozoa in a drop of semen dried on glass."},
    # CC BY-SA 4.0, Alexander Klepnev
    {"commons_title": "File:Сперматозоиды.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "sperm", "title": "Human sperm, acridine orange", "caption": "Fluorescence image of human spermatozoa stained with acridine orange, heads glowing orange against a dark background."},
    # CC BY-SA 4.0, Ajay Kumar Chaurasiya
    {"commons_title": "File:Sperms in direct wet mount of semen microscopy.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "sperm", "title": "Sperm in a wet mount", "caption": "Unstained wet mount of semen viewed by light microscopy at 800x, as done in routine semen analysis."},
    # CC BY-SA 4.0, J3D3
    {"commons_title": "File:Sperms In Urine Detail.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "sperm", "title": "Sperm in urine, May-Grünwald", "caption": "Spermatozoa from a urine sample, heat-fixed, stained with May-Grünwald and viewed with a 100x oil-immersion objective."},
    # CC BY-SA 4.0, OlgaMaliuta
    {"commons_title": "File:Telophase meiosis I.png", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "oocyte", "title": "Human oocyte, telophase of meiosis I", "caption": "Polarized-light image (200x) of a human oocyte at telophase I: the first polar body sits in the perivitelline space, still linked to the oocyte by remnants of the spindle."},
    # CC BY-SA 4.0, OlgaMaliuta
    {"commons_title": "File:Anaphase meiosis I.png", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "oocyte", "title": "Human oocyte, anaphase of meiosis I", "caption": "Polarized-light image (200x) of a human oocyte at anaphase I, caught as the first polar body begins to separate at the site of the birefringent spindle."},
    # CC0, Prue Talbot
    {"commons_title": "File:Zona pellucida.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "oocyte", "title": "Mouse oocyte surface (TEM)", "caption": "Transmission electron micrograph of the cortex of a mouse oocyte during fertilization, with microvilli on its surface and the zona pellucida around it."},
    # CC BY-SA 4.0, Jakub Friedl
    {"commons_title": "File:Pig oocyte dapi 1.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "oocyte", "title": "Pig oocyte, DAPI", "caption": "Fluorescence image (40x objective) of a DAPI-stained pig oocyte with a few remaining granulosa cells attached to one side."},
    # CC BY-SA 2.0, Ed Uthman, MD
    {"commons_title": "File:Mitosis In A Lymphoma Cell.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "mitotic-cell", "title": "Mitosis in a lymphoma cell", "caption": "Wright-stained preparation at 1000x showing a lymphoma cell in mitosis among non-dividing cells."},
    # CC BY 4.0, OpenStax
    {"commons_title": "File:0300 Flourescence Stained.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "mitotic-cell", "title": "Newt lung cell in anaphase", "caption": "Newt lung cell in anaphase stained with fluorescent dyes: spindle microtubules green, membrane and cytoplasm red, chromosomes light blue."},
    # CC BY-SA 4.0, F Lamiot (transfer)
    {"commons_title": "File:Dividing Cell Fluorescence.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "mitotic-cell", "title": "Dividing human cancer cell", "caption": "Epifluorescence image of a fixed dividing human cancer cell stained for DNA (DAPI, blue), INCENP (GFP, green) and tubulin (red)."},
    # CC BY-SA 4.0, Bozonhiggsa
    {"commons_title": "File:Cutie in mitosis.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "mitotic-cell", "title": "NIH 3T3 cell in mitosis (confocal)", "caption": "Confocal image of a mitotic mouse NIH 3T3 fibroblast immunostained for tubulin (green) with DAPI-stained chromosomes (blue)."},
    # CC BY-SA 3.0, Lothar Schermelleh
    {"commons_title": "File:3D-SIM-4 Anaphase 3 color.jpg", "kind": "micrograph", "system": "", "techniques": ["sim"], "cell_type": "mitotic-cell", "title": "Late mitosis by 3D-SIM", "caption": "3D structured illumination rendering of two mouse daughter nuclei in telophase, with the spindle (tubulin, orange), actin (phalloidin, green) and chromatin (DAPI, cyan)."},
    # Public domain, National Institute for Occupational Safety and Health (NIOSH)
    {"commons_title": "File:Spindle with Four Poles (8744518858).jpg", "kind": "micrograph", "system": "", "techniques": ["widefield", "dic"], "cell_type": "mitotic-cell", "title": "Four-pole mitotic spindle", "caption": "Abnormal mitotic spindle with four poles in a cell exposed to carbon nanotubes: tubulin by immunofluorescence (red), DNA by DAPI (blue), nanotubes by DIC (black), merged."},
    # CC BY-SA 4.0, Viktoriia Kosach
    {"commons_title": "File:Cytokeratin 8.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cancer-cell", "title": "MCF-7 breast cancer cells, cytokeratin 8", "caption": "Immunofluorescence image of a colony of MCF-7 human breast cancer cells stained for cytokeratin 8."},
    # CC BY 4.0, Korinna
    {"commons_title": "File:Fluorescence microscopy of the oral cancer cells.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cancer-cell", "title": "Oral cancer cells, fluorescence", "caption": "Fluorescence micrograph of oral cancer cells, seen as scattered green cell clusters."},
    # CC BY-SA 3.0, Ayoung219
    {"commons_title": "File:Binucleated cell overlay.tiff", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cancer-cell", "title": "Binucleated oral carcinoma cell", "caption": "Binucleated cell of the oral squamous carcinoma line UPMC-SCC103, labelled with anti-tubulin antibody and DAPI-stained nuclei, the two images superimposed."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Signet ring cell carcinoma - very high mag.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cancer-cell", "title": "Signet ring cell carcinoma (H&E)", "caption": "Very high magnification H&E section of gastric signet ring cell carcinoma, whose cells have their nuclei pushed aside by mucin."},
    # CC0, Mikael Häggström, M.D.
    {"commons_title": "File:High-magnification micrograph of basal-cell carcinoma.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cancer-cell", "title": "Basal-cell carcinoma (H&E)", "caption": "High-magnification H&E micrograph of basal-cell carcinoma; the purple cancer cells stand out against the paler stroma."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Clear cell renal cell carcinoma high mag cropped.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cancer-cell", "title": "Clear cell renal carcinoma (H&E)", "caption": "H&E section of clear cell renal cell carcinoma: nests of cells with clear cytoplasm and moderately atypical nuclei."},
]
