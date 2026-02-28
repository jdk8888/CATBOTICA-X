# Blender/UE5 Reference Guide for Catbotica

## Overview
Reference guide for building 3D environments and characters in Blender and Unreal Engine 5, based on `bible/worldbuilding.md` and `bible/characters.md`.

---

## Character Modeling References

### Robot Character (Protagonist)
**Reference:** `bible/characters.md` - Robot Character

**Modeling Specs:**
- **Type:** Humanoid robot
- **Height:** Standard humanoid proportions
- **Body:** Sleek structure with visible neck joint
- **Head:** Prominent, expressive face
- **Eyes:** Black (non-reflective or matte)
- **Limbs:** Bipedal, two legs, two arms
- **Details:** 
  - Purple stripe along side
  - Pink, blue, and green accent details
  - Retro-futuristic aesthetic
  - Clean, stylized surfaces

**Materials:**
- Base: Metallic or glossy plastic
- Accents: Purple, pink, blue, green (saturated)
- Finish: Clean, stylized (not photorealistic)

**Rigging:**
- Standard humanoid rig
- Expressive face controls
- Visible joint articulation

---

### Anthropomorphic Cat Character
**Reference:** `bible/characters.md` - Anthropomorphic Cat Character

**Modeling Specs:**
- **Type:** Anthropomorphic (human-like posture)
- **Base:** Cat anatomy with human proportions
- **Fur:** Detailed texture, can be white variant
- **Eyes:** Expressive, can show closed (sleeping) state
- **Posture:** Human-like standing/walking

**Materials:**
- Fur shader (Blender: Principled BSDF with fur texture)
- White variant available
- Expressive eye materials

**Rigging:**
- Hybrid cat/human rig
- Facial expression controls
- Flexible body for various emotional states

---

### Anthropomorphic Dog Character
**Reference:** `bible/characters.md` - Anthropomorphic Dog Character

**Modeling Specs:**
- **Type:** Anthropomorphic dog
- **Posture:** Active, running poses
- **Expression:** Mouth open (speaking)
- **Fur:** Detailed texture

**Materials:**
- Fur shader
- Natural dog coloring

**Rigging:**
- Dynamic running animations
- Speaking/mouth controls

---

### Humanoid Space Explorer
**Reference:** `bible/characters.md` - Humanoid Space Explorer

**Modeling Specs:**
- **Type:** Human in spacesuit
- **Suit:** Futuristic spacesuit design
- **Equipment:** Communication device, navigation equipment
- **Expression:** Contemplative, concerned

**Materials:**
- Spacesuit: White/light colored, reflective
- Equipment: Glowing screens (green for navigation)
- Visor: Clear or reflective

**Rigging:**
- Standard humanoid rig
- Equipment attachment points
- Spacesuit flexibility

---

## Environment Building References

### Catbotica Industries Campus
**Reference:** `bible/worldbuilding.md` - Catbotica Industries

**Layout:**
- Multiple buildings
- Open spaces between structures
- "CAMPUS" sign (prominent)
- Industrial/workshop aesthetic

**Building Style:**
- High ceilings
- Mechanical structures visible
- Industrial materials (metal, concrete)
- Neon lighting accents
- Retro-futuristic design

**Lighting:**
- Dim ambiance (darker tones)
- Neon accent lighting
- Industrial lighting fixtures
- Cyberpunk aesthetic

**Assets Needed:**
- Multiple building structures
- Mechanical equipment
- Neon signs
- Industrial walkways
- Open plaza areas

---

### Space Environment
**Reference:** `bible/worldbuilding.md` - Space/Outer Space

**Environment:**
- Vast, dark space
- Star field background
- Debris fields (optional)
- Meteor hazards (particle effects)

**Lighting:**
- Star lighting (distant point lights)
- Spaceship lighting
- Dramatic shadows
- Deep space atmosphere

**Assets Needed:**
- Star field (HDRI or particle system)
- Debris models
- Meteor models (for hazards)
- Spaceship models

**UE5 Setup:**
- Use Sky Atmosphere for space
- Particle systems for stars
- Volumetric fog for depth

---

### Spaceship Interior
**Reference:** `bible/worldbuilding.md` - Spaceship Interior

**Layout:**
- Control panels/consoles
- Navigation equipment
- Communication devices
- Can show damage (smoke effects)

**Style:**
- Futuristic, clean design
- Functional technology
- Emergency lighting capability
- Damage states available

**Assets Needed:**
- Control panels
- Navigation screens (green displays)
- Communication devices
- Interior structure
- Damage effects (smoke, sparks)

**Lighting:**
- Functional interior lighting
- Screen glow (green for navigation)
- Emergency lighting (red/orange)
- Ambient technology glow

---

### Alien Planet
**Reference:** `bible/worldbuilding.md` - Alien Planet

**Terrain:**
- Otherworldly, unusual formations
- Rocky, alien geology
- Earth tones and blues
- Unknown hazards

**Flora/Fauna:**
- Alien plants
- Octopus-like creatures
- Unfamiliar life forms

**Atmosphere:**
- Earth tones and blues
- Mysterious, intriguing
- Suspenseful mood

**Assets Needed:**
- Alien terrain models
- Alien flora
- Alien creature models
- Atmospheric effects

**UE5 Setup:**
- Custom skybox (earth tones/blues)
- Volumetric fog
- Alien terrain materials

---

### Jungle/Forest
**Reference:** `bible/worldbuilding.md` - Jungle/Forest

**Terrain:**
- Dense foliage
- Tall trees
- Pathways and clearings
- Rivers and water features

**Atmosphere:**
- Natural, untamed
- Exploration setting
- Adventure mood
- Natural lighting (sun through trees)

**Assets Needed:**
- Tree models (tall, dense)
- Foliage (dense undergrowth)
- River/water features
- Pathways
- Wildlife (insects, creatures)

**UE5 Setup:**
- Foliage system for density
- Water system for rivers
- Dynamic lighting (sun rays)
- Particle effects (insects)

---

### City/Urban Environment
**Reference:** `bible/worldbuilding.md` - City/Urban Environment

**Layout:**
- Bustling streets
- Buildings on both sides
- Traffic (cars, trucks)
- Streetlights

**Time of Day:**
- Day to night transition
- Streetlight illumination (night)
- Natural lighting (day)

**Assets Needed:**
- Building models
- Vehicle models
- Street furniture
- Streetlights
- Traffic systems

**UE5 Setup:**
- City generator or modular buildings
- Traffic system
- Day/night cycle
- Streetlight system

---

## Material Guidelines

### Retro-Futuristic Aesthetic
- **Metals:** Clean, stylized (not photorealistic)
- **Plastics:** Saturated colors, glossy
- **Neon:** Bright, emissive materials
- **Technology:** Glowing screens, clean interfaces

### Color Palettes
- **Space:** Dark (blacks, deep blues), star whites
- **Industrial:** Grays, dark tones, neon accents
- **Natural:** Earth tones, greens, browns
- **Alien:** Earth tones, blues
- **Cover Style:** Vibrant (purple, pink, blue, green)

---

## Animation References

### Character Animations
- **Robot:** Expressive, animated movements
- **Cat:** Relaxed, sleeping, active exploration
- **Dog:** Running, energetic, speaking
- **Space Explorer:** Contemplative, problem-solving poses

### Environmental Animations
- **Spaceship:** Travel through space, damage effects
- **Jungle:** Foliage movement, water flow
- **City:** Traffic, day/night cycle
- **Industrial:** Mechanical equipment, neon flicker

---

## Scene Composition Tips

1. **Reference Bible Files:** Always check `bible/worldbuilding.md` for location details
2. **Maintain Style:** Retro-futuristic, cyberpunk aesthetic throughout
3. **Color Coordination:** Match palettes to location types
4. **Lighting Mood:** Match to narrative themes (peaceful, tense, adventurous)
5. **Scale Reference:** Use character sizes as scale reference

---

## Export/Import Workflow

### Blender to UE5
1. Model characters/environments in Blender
2. Apply materials (UE5 compatible)
3. Export as FBX or use Datasmith
4. Import to UE5
5. Apply UE5 materials
6. Set up lighting

### Asset Organization
- Characters: `/Characters/`
- Environments: `/Environments/`
- Props: `/Props/`
- Materials: `/Materials/`

---

## Quick Reference Checklist

### Before Starting
- [ ] Review `bible/characters.md` for character specs
- [ ] Review `bible/worldbuilding.md` for location details
- [ ] Check `bible/timeline.md` for scene context
- [ ] Reference `workflow/comfyui-prompts.md` for style guidance

### During Modeling
- [ ] Maintain retro-futuristic aesthetic
- [ ] Use appropriate color palettes
- [ ] Match scale to character references
- [ ] Include key details from bible

### Before Export
- [ ] Verify materials are UE5 compatible
- [ ] Check scale is correct
- [ ] Ensure all details match bible references
- [ ] Test in target engine
