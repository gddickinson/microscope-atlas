# Cell-type micrographs from Wikimedia Commons; licence/author as reported by the Commons API (extmetadata).
CELL_IMAGES = [
    # Public domain, CDC/ Evangeline Sowers, Janice Haney Carr
    {"commons_title": "File:Ecoli dividing.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "bacterium", "title": "Dividing E. coli (SEM)", "caption": "A scanning electron micrograph of an Escherichia coli cell caught in division, showing where the cell wall pinches in to separate the two daughter cells."},
    # CC BY-SA 3.0, Y tambe
    {"commons_title": "File:Gram stain 01.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "bacterium", "title": "Gram stain of mixed bacteria", "caption": "Gram-stained smear at 1000x mixing purple Gram-positive cocci (Staphylococcus aureus) with red Gram-negative rods (Escherichia coli), imaged by brightfield light microscopy."},
    # CC BY-SA 4.0, Dr Graham Beards
    {"commons_title": "File:Staphylococcus aureus Gram stain.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "bacterium", "title": "Staphylococcus aureus, Gram stain", "caption": "Gram-stained Staphylococcus aureus seen by brightfield microscopy: purple Gram-positive cocci lying in grape-like clusters."},
    # CC BY-SA 4.0, Mixon K. Faluweki and Lucas Goehring
    {"commons_title": "File:Filamentous cyanobacteria under confocal fluorescence imaging.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "cyanobacterium", "title": "Oscillatoria filaments (confocal)", "caption": "Confocal fluorescence images of the gliding cyanobacterium Oscillatoria lutea: long curved filaments that, at higher magnification, resolve into chains of single cells."},
    # CC BY-SA 2.5, Daniel Vaulot, CNRS, Station Biologique de Roscoff
    {"commons_title": "File:Picoplancton fluorescence Pacific.jpg", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "cyanobacterium", "title": "Marine picoplankton (epifluorescence)", "caption": "Epifluorescence micrograph of Pacific picoplankton under blue excitation; orange dots are Synechococcus cyanobacteria, red dots are tiny eukaryotic algae."},
    # Public domain, Masur
    {"commons_title": "File:S cerevisiae under DIC microscopy.jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "yeast", "title": "Budding yeast (DIC)", "caption": "Saccharomyces cerevisiae cells imaged with differential interference contrast on an Olympus BX61 with a 100x/1.40 oil-immersion objective."},
    # CC BY 3.0, Mogana Das Murtey and Patchamuthu Ramasamy
    {"commons_title": "File:Saccharomyces cerevisiae SEM.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "yeast", "title": "Baker's yeast (SEM)", "caption": "Scanning electron micrograph of Saccharomyces cerevisiae cells."},
    # CC BY-SA 4.0, Ajay Kumar Chaurasiya
    {"commons_title": "File:Gram positive yeast cells in Gram staining of culture.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "yeast", "title": "Candida yeast, Gram stain", "caption": "Gram-stained Candida culture viewed by brightfield microscopy; the oval yeast cells take up the purple Gram-positive stain."},
    # CC BY 2.5, Images courtesy of Mary Ann Tiffany, San Diego State University.
    {"commons_title": "File:Diatoms.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "diatom", "title": "Diatom frustules (SEM)", "caption": "Scanning electron micrographs of several diatom species, showing the patterned silica shells (frustules) of centric and pennate forms."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Диатомовые водоросли.tif", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "diatom", "title": "Mixed diatoms (DIC)", "caption": "Assorted live diatoms imaged with differential interference contrast through a 40x objective."},
    # CC BY-SA 3.0, Zephyris
    {"commons_title": "File:Diatomaceous Earth DarkField.jpg", "kind": "micrograph", "system": "", "techniques": ["darkfield"], "cell_type": "diatom", "title": "Diatomaceous earth (darkfield)", "caption": "Fossil diatom shells in diatomaceous earth seen under darkfield illumination, which makes the silica frustules glow against a black background."},
    # CC BY-SA 4.0, Wiedehopf20
    {"commons_title": "File:The ciliate Frontonia sp.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "ciliate", "title": "Frontonia feeding (phase contrast)", "caption": "Phase-contrast micrograph of the ciliate Frontonia digesting blue-green algae; its cytostome (cell mouth) is on the lower right."},
    # CC BY-SA 4.0, Djpmapleferryman
    {"commons_title": "File:EM alveoli ciliate paramecium putrinum.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "ciliate", "title": "Paramecium cortex (TEM)", "caption": "Thin-section electron micrograph of Paramecium putrinum showing the flattened alveoli lying just beneath the cell membrane."},
    # CC BY-SA 4.0, Sayanur Rahaman
    {"commons_title": "File:Paramecium undergoing Cyst Formation.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "ciliate", "title": "Paramecium forming a cyst", "caption": "Safranin-stained Paramecium forming a cyst under dehydrating conditions, imaged by brightfield light microscopy, with bacteria around it."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Амеба и водоросли.tif", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "amoeba", "title": "Amoeba among algae (DIC)", "caption": "A free-living amoeba next to algal cells, imaged with differential interference contrast."},
    # CC BY-SA 4.0, Andrei Savitsky
    {"commons_title": "File:Амеба рода Cochliopodium.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "amoeba", "title": "Cochliopodium amoeba (phase contrast)", "caption": "Phase-contrast micrograph of a Cochliopodium amoeba with three food vacuoles holding algae, a dark nucleus, and many small contractile vacuoles."},
    # CC0, Original micrograph: CDC/ Dr. Mae Melvin; Dr. Greene Annotations by Mikael Häggs
    {"commons_title": "File:Entamoeba histolytica trophozoite.png", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "amoeba", "title": "Entamoeba histolytica (trichrome)", "caption": "Trichrome-stained trophozoite of the parasitic amoeba Entamoeba histolytica, seen by brightfield microscopy, with ingested red blood cells inside."},
    # CC BY 4.0, KarlGaff
    {"commons_title": "File:Canadian Pond Weed.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "plant-cell", "title": "Elodea leaf cells (polarised light)", "caption": "Focus-stacked image of an Elodea canadensis leaf in compensated polarised light at 100x, showing the midrib and cells packed with chloroplasts."},
    # CC BY-SA 4.0, Ivan A. Novikov
    {"commons_title": "File:Onion flake. Cells. SEM-BSE.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "plant-cell", "title": "Onion epidermis (SEM)", "caption": "Backscattered-electron SEM image of onion epidermal cells stained with lanthanides; nuclei and small organelles show beneath the cell walls."},
    # CC BY-SA 3.0, Adrian J. Hunter
    {"commons_title": "File:Cells from a red onion epidermal peel.tif", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "plant-cell", "title": "Red onion epidermal cells", "caption": "Epidermal peel from a red onion bulb on an Olympus CX31 light microscope at 100x; the natural red pigment fills the cell vacuoles."},
    # Public domain, derived by me
    {"commons_title": "File:Tomato leaf stomate cropped and scaled.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "guard-cell", "title": "Tomato leaf stoma (SEM)", "caption": "Scanning electron micrograph of a stoma on a tomato leaf, with the pair of guard cells around the pore."},
    # CC BY-SA 4.0, Greeneggplantz
    {"commons_title": "File:How do plants breathe?.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "guard-cell", "title": "Stomata, safranin stain", "caption": "Brightfield micrograph of two safranin-stained stomata, each with paired guard cells and the subsidiary cells around them."},
    # CC BY 4.0, GrahamInHorsham
    {"commons_title": "File:Tradescantia leaf underside cast impression.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "guard-cell", "title": "Tradescantia stomata (resin cast)", "caption": "Resin cast of a Tradescantia zebrina leaf underside showing stomata and epidermal cells, in transmitted light with partially crossed polarisers."},
    # CC BY 3.0, Mark Talbot, CSIRO
    {"commons_title": "File:CSIRO ScienceImage 11348 Acacia pollen.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "pollen", "title": "Acacia pollen (SEM)", "caption": "Scanning electron micrograph of an acacia pollen grain about 50 micrometres long."},
    # CC BY-SA 4.0, Dietzel65
    {"commons_title": "File:2016-07-28-Hibiscus-Pollen3 001.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "pollen", "title": "Hibiscus pollen (confocal)", "caption": "Projection of confocal images of spiky hibiscus pollen grains, recorded as autofluorescence in three colour channels with 405 nm excitation."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Тюльпан пыльца.tif", "kind": "micrograph", "system": "", "techniques": ["brightfield", "dic", "phase-contrast"], "cell_type": "pollen", "title": "Tulip pollen, five contrast methods", "caption": "Tulip pollen grains shown side by side with different methods: epi-illumination, brightfield, DIC, phase contrast and autofluorescence."},
    # CC BY-SA 3.0, Scootdive (talk · contribs)
    {"commons_title": "File:Red blood cells (2).jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "erythrocyte", "title": "Red blood cells (SEM)", "caption": "Scanning electron micrograph of several red blood cells."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Blood-rbcs.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "erythrocyte", "title": "Red blood cells, Wright stain", "caption": "Wright-stained blood smear under brightfield microscopy showing a field of erythrocytes."},
    # CC BY-SA 4.0, Elsnicová
    {"commons_title": "File:Red Blood Cell in capillary.tif", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "erythrocyte", "title": "Red cell in a capillary (TEM)", "caption": "Transmission electron micrograph of a red blood cell squeezed inside a capillary in rat heart muscle."},
    # CC BY 2.5, Volker Brinkmann
    {"commons_title": "File:Neutrophil with anthrax copy.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "neutrophil", "title": "Neutrophil engulfing anthrax (SEM)", "caption": "Scanning electron micrograph of a neutrophil engulfing Bacillus anthracis bacteria."},
    # Public domain, Tommaso Leonardi
    {"commons_title": "File:Neutrophil.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neutrophil", "title": "Neutrophil, May-Grunwald-Giemsa", "caption": "Blood smear stained with May-Grunwald-Giemsa and viewed with a 100x oil objective, showing a neutrophil granulocyte."},
    # CC BY 4.0, Gibellini, L.; Borella, R.; Santacroce, E.; Serattini, E.; Boraldi, F.; Quaglino
    {"commons_title": "File:Representative transmission electron micrographs showing normal-density neutrophils (NDNs) and low-density neutrophils (LDNs) at different grades of maturation.png", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "neutrophil", "title": "Neutrophils at different maturity (TEM)", "caption": "Transmission electron micrographs comparing neutrophil subsets, from immature cells with unlobed nuclei to mature cells with multi-lobed nuclei and granules."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Blood-lymphocyte1.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "lymphocyte", "title": "Lymphocyte, Wright stain", "caption": "Wright-stained blood smear in brightfield: a lymphocyte among red blood cells."},
    # CC BY 2.0, NIAID
    {"commons_title": "File:Human B Lymphocyte - NIAID.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "lymphocyte", "title": "Human B cell (SEM)", "caption": "Colourised scanning electron micrograph of a B lymphocyte from a human donor."},
    # CC BY 2.0, NIAID
    {"commons_title": "File:T Lymphocyte (16760076824).jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "lymphocyte", "title": "T lymphocyte (SEM)", "caption": "Colourised scanning electron micrograph of a T lymphocyte."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Blood-monocyte.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "macrophage", "title": "Monocyte, Wright stain", "caption": "Wright-stained blood smear in brightfield showing a monocyte, the blood precursor of macrophages, among red cells."},
    # CC BY 2.0, NIAID
    {"commons_title": "File:Macrophage by NIAID.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "macrophage", "title": "Macrophage (SEM)", "caption": "Colourised scanning electron micrograph of a macrophage."},
    # Public domain, Louisa Howard
    {"commons_title": "File:Golgi in the cytoplasm of a macrophage in the alveolus (lung) - TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "macrophage", "title": "Alveolar macrophage Golgi (TEM)", "caption": "Transmission electron micrograph of a thin section of lung, showing Golgi stacks in the cytoplasm of an alveolar macrophage."},
    # CC BY-SA 3.0, Dr Graham Beards
    {"commons_title": "File:Eosinophil 2.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophil, Giemsa stain", "caption": "Giemsa-stained blood smear in brightfield showing an eosinophil, a type of white blood cell."},
    # CC BY-SA 4.0, Echinaceapallida
    {"commons_title": "File:Blood-eosinophil2.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophil in a blood smear", "caption": "Stained blood smear in brightfield showing an eosinophil among red blood cells and platelets."},
    # CC BY 2.0, Ed Uthman from Houston, TX, USA
    {"commons_title": "File:Eosinophils in Peripheral Blood Smear (4746281402).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "eosinophil", "title": "Eosinophils in peripheral blood", "caption": "Stained peripheral blood smear in brightfield containing several eosinophils."},
    # CC BY-SA 4.0, SpicyMilkBoy
    {"commons_title": "File:Thrombocytosis blood smear.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Thrombocytosis smear", "caption": "Stained blood smear in brightfield with many more platelets than normal (thrombocytosis) scattered between the red cells."},
    # CC BY 2.0, Ed Uthman from Houston, TX, USA
    {"commons_title": "File:Giant Platelet, Peripheral Blood Smear (6032662354).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Giant platelet", "caption": "Stained peripheral blood smear in brightfield showing an unusually large platelet next to red blood cells."},
    # CC BY-SA 3.0, Paulo Henrique Orlandi Mourao
    {"commons_title": "File:Platelet Satellitism smear 2009-09-11.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "platelet", "title": "Platelet satellitism", "caption": "Stained blood smear in brightfield where platelets cluster around neutrophils, an artefact of EDTA-treated blood."},
    # CC BY-SA 2.5, MethoxyRoxy
    {"commons_title": "File:Pyramidal hippocampal neuron 40x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "neuron", "title": "Golgi-stained pyramidal neuron", "caption": "Golgi-stained pyramidal neuron in human hippocampus at 40x in brightfield."},
    # Public domain, National Institutes of Health (NIH)
    {"commons_title": "File:Confocal image of spiny neuron.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "neuron", "title": "Medium spiny neuron (confocal)", "caption": "Confocal projection of a striatal medium spiny neuron filled with eGFP, showing its spine-covered dendrites."},
    # CC BY-SA 4.0, ManuelSchottdorf
    {"commons_title": "File:GFP Neurons.png", "kind": "micrograph", "system": "", "techniques": ["widefield"], "cell_type": "neuron", "title": "Cultured cortical neurons (GFP)", "caption": "Rat cortical neurons in culture expressing GFP, photographed on a Zeiss Axiovert fluorescence microscope with a GFP filter set."},
    # CC BY-SA 4.0, Pics56
    {"commons_title": "File:Activated astrocytes.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "glial-cell", "title": "Activated astrocytes (confocal)", "caption": "Confocal image of activated astrocytes in the cortex of a mouse model of Alzheimer's disease."},
    # CC BY-SA 4.0, Oleg Tsupykov
    {"commons_title": "File:NG-2 progenitors and astrocytes in culture.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "glial-cell", "title": "Oligodendrocyte progenitors and astrocytes", "caption": "Confocal image of cultured rat glia: NG2-positive oligodendrocyte progenitors (green) and GFAP-positive astrocytes (red)."},
    # CC BY 4.0, Syed07
    {"commons_title": "File:Fluorescently Labeled Microglia in a Mouse Brain Section.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "glial-cell", "title": "Microglia in mouse brain (confocal)", "caption": "Iba1-immunostained microglia (green) in a coronal mouse brain section, imaged by confocal microscopy at 20x and 60x."},
    # CC BY-SA 3.0, Rollroboter
    {"commons_title": "File:Muskel ( 1).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "skeletal-muscle", "title": "Skeletal muscle fibres, H&E", "caption": "Light micrograph of skeletal muscle fibres cut lengthwise and stained with haematoxylin and eosin."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Muscle Tissue Skeletal Muscle Fibers (41241952644).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "skeletal-muscle", "title": "Teased skeletal muscle", "caption": "Prepared slide of teased skeletal muscle fibres at 200x under a brightfield light microscope."},
    # CC BY 4.0, PW31
    {"commons_title": "File:Muscle viewed with polarized light.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle in polarised light", "caption": "Cardiac muscle viewed in polarised light, where the birefringent striated bands of the cardiomyocytes stand out in green."},
    # CC BY 3.0, OpenStax College
    {"commons_title": "File:414c Cardiacmuscle.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Cardiac muscle (light micrograph)", "caption": "Light micrograph of stained cardiac muscle at about 1600x."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Muscle Tissue Intercalated Discs in Cardiac Muscle (41931906821).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cardiomyocyte", "title": "Intercalated discs in cardiac muscle", "caption": "Prepared longitudinal section of cardiac muscle at 400x under a brightfield light microscope, showing the intercalated discs that join neighbouring cardiomyocytes."},
    # CC BY-SA 4.0, Alexander G. Cheroske
    {"commons_title": "File:Smooth muscle 400x.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle at 400x", "caption": "Histological section of smooth muscle in a light microscope at 400x."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Muscle Tissue Smooth (40087100490).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "smooth-muscle", "title": "Smooth muscle in cross section", "caption": "Prepared cross section of smooth muscle at 400x under a brightfield light microscope."},
    # CC BY-SA 4.0, Fritzmann2002
    {"commons_title": "File:Human Cheek Cells (Methylene Blue Stain).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Cheek cells, methylene blue", "caption": "Human cheek (buccal) epithelial cells stained with methylene blue at 400x in brightfield."},
    # CC BY 4.0, Daliasalloum
    {"commons_title": "File:Human epithelial cells stained with methylene blue dye.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Methylene blue cheek smear", "caption": "Squamous epithelial cells scraped from the inside of the cheek and stained with methylene blue, imaged in brightfield."},
    # CC BY-SA 4.0, Adel.stoyanova
    {"commons_title": "File:Cervical cytology smear (Pap stain).png", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "squamous-epithelium", "title": "Pap smear squamous cells", "caption": "Papanicolaou-stained cervical smear in brightfield showing superficial and intermediate squamous epithelial cells."},
    # CC0, Mikael Häggström, M.D. Author info - Reusing images- Conflicts of interest: None
    {"commons_title": "File:Histology of normal simple columnar epithelium of the endometrium.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Columnar epithelium, H&E", "caption": "H&E-stained section of the endometrial surface in brightfield: a single layer of tall columnar epithelial cells."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Epithelial Tissues Brush Border in Simple Columnar Epithelium (27854453998).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "columnar-epithelium", "title": "Gut columnar epithelium with brush border", "caption": "Prepared cross section of mammalian gut at 400x under a brightfield light microscope, showing simple columnar epithelium with a brush border."},
    # CC BY 3.0, Graham Beards
    {"commons_title": "File:Rotavirus infected gut.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "columnar-epithelium", "title": "Enterocytes and microvilli (TEM)", "caption": "Transmission electron micrograph comparing a rotavirus-infected enterocyte, whose microvilli are destroyed, with an uninfected one."},
    # CC BY-SA 3.0, Y tambe
    {"commons_title": "File:Mouse Embryo Fibroblasts.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "fibroblast", "title": "Mouse embryo fibroblasts (phase contrast)", "caption": "Phase-contrast micrograph at 100x of mouse embryonic fibroblasts spread out in culture."},
    # CC BY 4.0, Howard Vindin
    {"commons_title": "File:Microtubules in Primary Mouse Embryonic Fibroblasts.png", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "fibroblast", "title": "Fibroblast microtubules (confocal)", "caption": "Primary mouse embryonic fibroblasts immunostained for tubulin and imaged on a Zeiss confocal microscope."},
    # CC BY 2.0, Confocal_analysis_of_dermal_fibroblasts_after_heat_shock_stress_(progeria).jpg: 
    {"commons_title": "File:Confocal analysis of dermal fibroblasts after heat shock stress (progeria) CROPPED.jpg", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "fibroblast", "title": "Dermal fibroblasts after heat shock (confocal)", "caption": "Confocal immunofluorescence of human dermal fibroblasts fixed at different times after a heat shock, from a study of progeria."},
    # Public domain, National Institutes of Health (NIH)
    {"commons_title": "File:HeLa-II.jpg", "kind": "micrograph", "system": "", "techniques": ["multiphoton"], "cell_type": "cultured-cell-line", "title": "HeLa cells (multiphoton)", "caption": "Multiphoton fluorescence image of HeLa cells: actin stained with phalloidin (red), microtubules (cyan) and nuclei (blue)."},
    # CC BY 2.5, SubtleGuest at English Wikipedia
    {"commons_title": "File:NIH 3T3.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "cultured-cell-line", "title": "NIH 3T3 cells (phase contrast)", "caption": "NIH 3T3 mouse fibroblast-line cells in culture, photographed on an inverted microscope with phase contrast."},
    # CC BY 4.0, Howard Vindin
    {"commons_title": "File:Actin Filaments in a Neuroblastoma cell Line.png", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "cultured-cell-line", "title": "Neuroblastoma cell line actin (confocal)", "caption": "SH-EP neuroblastoma cells fixed, stained with phalloidin for actin filaments and imaged by confocal microscopy."},
    # CC BY-SA 3.0, Y tambe
    {"commons_title": "File:HaCaT cells.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "keratinocyte", "title": "HaCaT keratinocytes (phase contrast)", "caption": "Phase-contrast micrograph at 100x of HaCaT cells, an immortalised human keratinocyte line."},
    # CC BY-SA 4.0, Accuratelibrarian
    {"commons_title": "File:HaCaT Cells Phase Contrast.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "keratinocyte", "title": "Subconfluent HaCaT keratinocytes", "caption": "Phase-contrast image of HaCaT keratinocytes in exponential growth at roughly a third confluence."},
    # CC BY-SA 4.0, Accuratelibrarian
    {"commons_title": "File:DAPI-stained nuclei of HaCaT keratinocytes.png", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "keratinocyte", "title": "Keratinocyte nuclei, DAPI (confocal)", "caption": "Confocal fluorescence micrograph of HaCaT keratinocyte nuclei stained with DAPI."},
    # CC BY-SA 4.0, M. Oktar Guloglu
    {"commons_title": "File:Adipocyte2.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "Adipocytes, Oil Red O", "caption": "PA6 preadipocytes differentiated into adipocytes, with their lipid droplets stained red by Oil Red O, imaged by light microscopy."},
    # CC BY-SA 4.0, Rkott
    {"commons_title": "File:Adipocytes Lipid Droplets Oil Red O Staining Rkott 2023.tif", "kind": "micrograph", "system": "", "techniques": ["confocal"], "cell_type": "adipocyte", "title": "Fat body adipocytes (confocal)", "caption": "Confocal image of adipocytes from the adult Drosophila fat body, with lipid droplets labelled red by Oil Red O and nuclei counterstained."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Adipocytes in Adult Parathyroid Gland (46621204125).jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "adipocyte", "title": "Adipocytes in parathyroid, H&E", "caption": "H&E-stained section of human parathyroid gland at 400x in brightfield, with adipocytes among the gland tissue."},
    # CC BY-SA 3.0, Ganímedes
    {"commons_title": "File:Cartilage03.JPG", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "chondrocyte", "title": "Hyaline cartilage, H&E", "caption": "H&E-stained hyaline cartilage from the trachea at 400x in brightfield, with chondrocytes sitting in lacunae within a lilac matrix."},
    # CC BY 3.0, Emmanuelm at en.wikipedia
    {"commons_title": "File:Cartilage polarised.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "chondrocyte", "title": "Hyaline cartilage in polarised light", "caption": "H&E-stained hyaline cartilage viewed under polarised light, a view of chondrocytes in their matrix."},
    # CC BY 4.0, Michael J.F. Blumer
    {"commons_title": "File:Composition of the cartilage.jpg", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "chondrocyte", "title": "Chondrocytes (TEM)", "caption": "Transmission electron micrographs of hyaline cartilage: chondrocytes grouped in chondrons, rich in rough endoplasmic reticulum."},
    # CC BY 4.0, Michael J.F. Blumer
    {"commons_title": "File:Differentiation of the osteoblasts to osteocytes. (A) Light Microscopy (LM) and (B–D) TEM.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield", "tem"], "cell_type": "osteocyte", "title": "Osteoblasts becoming osteocytes", "caption": "Toluidine blue semi-thin section of trabecular bone (light microscopy) and TEM panels following osteoblasts as they become embedded osteocytes."},
    # CC BY 4.0, vom Scheidt, A., Krug, J., Goggin, P. et al.
    {"commons_title": "File:Lacunae and canaliculi.jpg", "kind": "micrograph", "system": "", "techniques": ["sem", "brightfield", "confocal"], "cell_type": "osteocyte", "title": "Osteocyte lacunae, four methods", "caption": "Osteocyte lacunae and canaliculi in bone compared with SEM of acid-etched bone, backscatter imaging, silver-stained brightfield and confocal microscopy."},
    # CC0, Berkshire Community College Bioscience Image Library
    {"commons_title": "File:Connective Tissue Compact Bone (41068144634).jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "osteocyte", "title": "Compact bone (phase contrast)", "caption": "Ground cross section of human compact bone at 400x in phase contrast, showing the bone structure in which osteocytes live."},
    # CC BY-SA 4.0, Alexquaas
    {"commons_title": "File:400x CAB liver megamitos.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "hepatocyte", "title": "Hepatocytes, CAB stain", "caption": "Liver hepatocytes stained with chromotrope aniline blue at 400x in brightfield, showing giant mitochondria (megamitochondria)."},
    # CC BY 4.0, Bochimoto H, Matsuno N, Ishihara Y, Shonaka T, Koga D, Hira Y, et al.
    {"commons_title": "File:Hepatocito TEM.png", "kind": "micrograph", "system": "", "techniques": ["tem"], "cell_type": "hepatocyte", "title": "Pig hepatocyte (TEM)", "caption": "Transmission electron micrographs of ultrathin sections of pig liver, with hepatocyte nuclei coloured blue and mitochondria green."},
    # CC BY 4.0, Bochimoto H, Matsuno N, Ishihara Y, Shonaka T, Koga D, Hira Y, et al.
    {"commons_title": "File:Hepatocito SEM.png", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "hepatocyte", "title": "Pig hepatocyte (SEM)", "caption": "Scanning electron micrographs of osmium-macerated pig liver, showing the inside of hepatocytes with the nucleus in blue and mitochondria in green."},
    # Public domain, No specific author
    {"commons_title": "File:Spermatozoa-human-3140x.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "sperm", "title": "Human sperm (SEM)", "caption": "Scanning electron micrograph of human spermatozoa on a filter at 3140x, showing heads and tails."},
    # CC BY 4.0, Alexander Klepnev
    {"commons_title": "File:Сперматозоиды.tif", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "sperm", "title": "Sperm (phase contrast)", "caption": "Spermatozoa imaged with phase contrast through a 100x objective."},
    # CC BY 4.0, Ros-Santaella JL, Pintus E, Garde JJ. 2015.
    {"commons_title": "File:The main structures of a red deer (Cervus elaphus) spermatozoon - peerj.1478.png", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "sperm", "title": "Red deer spermatozoon", "caption": "Phase-contrast micrograph (40x objective) of a red deer spermatozoon with its main structures labelled."},
    # CC BY-SA 2.0, ZEISS Microscopy from Germany
    {"commons_title": "File:Oocyte with Zona pellucida (27771482282).jpg", "kind": "micrograph", "system": "", "techniques": ["dic"], "cell_type": "oocyte", "title": "Human oocyte (PlasDIC)", "caption": "Human oocyte with its zona pellucida, imaged for IVF work on an inverted microscope with PlasDIC contrast."},
    # CC BY-SA 4.0, OlgaMaliuta
    {"commons_title": "File:Metaphase meiosis II.png", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "oocyte", "title": "MII human oocyte (polarised light)", "caption": "Mature metaphase II human oocyte in polarised light: the meiotic spindle and the three layers of the zona pellucida show up, with the first polar body nearby."},
    # CC BY-SA 4.0, OlgaMaliuta
    {"commons_title": "File:Metephase meiosis I.jpg", "kind": "micrograph", "system": "", "techniques": ["polarization"], "cell_type": "oocyte", "title": "Meiosis I spindle in a human oocyte", "caption": "Human oocyte in metaphase of meiosis I viewed with polarised light microscopy, which reveals the birefringent spindle."},
    # CC BY-SA 3.0, staticd
    {"commons_title": "File:Onion root mitosis.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "mitotic-cell", "title": "Onion root tip mitosis", "caption": "Acetocarmine/orcein-stained onion root tip squash in brightfield, with cells in prophase, metaphase, anaphase and telophase."},
    # CC BY-SA 4.0, Catfaster
    {"commons_title": "File:Onion Root Tip Cells Mitosis.jpg", "kind": "micrograph", "system": "", "techniques": ["phase-contrast"], "cell_type": "mitotic-cell", "title": "Onion root cells (phase contrast)", "caption": "Dividing onion root tip cells under a phase-contrast microscope."},
    # Public domain, Unknown photographer
    {"commons_title": "File:Mitosis (1).jpg", "kind": "micrograph", "system": "", "techniques": ["sem", "brightfield"], "cell_type": "mitotic-cell", "title": "Dividing CHO cell (SEM)", "caption": "SEM of a cultured Chinese hamster ovary cell in anaphase, covered in microvilli, with a light micrograph inset of the stained chromosomes."},
    # Public domain, National Institutes of Health (NIH)
    {"commons_title": "File:HeLa-V.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "mitotic-cell", "title": "Just-divided HeLa cells (SEM)", "caption": "High-resolution scanning electron micrograph of two HeLa cells that have just completed division."},
    # Public domain, Unknown photographer
    {"commons_title": "File:Breast cancer cell (2).jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "cancer-cell", "title": "Breast cancer cell (SEM)", "caption": "Scanning electron micrograph of the surface of a breast cancer cell at high magnification."},
    # CC BY-SA 3.0, Nephron
    {"commons_title": "File:Glassy cell carcinoma - high mag.jpg", "kind": "micrograph", "system": "", "techniques": ["brightfield"], "cell_type": "cancer-cell", "title": "Glassy cell carcinoma, H&E", "caption": "H&E-stained section of glassy cell carcinoma of the cervix at high magnification in brightfield; the tumour is named for its glass-like cytoplasm."},
    # Public domain, Unknown photographer
    {"commons_title": "File:Hela cells with adenovirus.jpg", "kind": "micrograph", "system": "", "techniques": ["sem"], "cell_type": "cancer-cell", "title": "HeLa cancer cells (SEM)", "caption": "Scanning electron micrograph of cultured HeLa cells, a line originally derived from a cervical cancer, with adenovirus."},
]
