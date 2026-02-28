# Three.js Integration Reference for Catbotica

Reference guide for building interactive Three.js experiences based on the Catbotica Series Bible.

---

## Character Models

### Robot Character
**Reference:** `bible/characters.md` - Robot Character

**Three.js Implementation:**
```javascript
// Character properties
const robotCharacter = {
  type: 'humanoid_robot',
  appearance: {
    face: 'prominent_expressive',
    eyes: 'black',
    body: 'sleek_structure',
    neckJoint: 'visible',
    legs: 'bipedal',
    colors: {
      stripe: 'purple',
      accents: ['pink', 'blue', 'green']
    },
    style: 'retro_futuristic'
  },
  materials: {
    base: 'metallic_glossy',
    accents: 'saturated_colors'
  }
};
```

**3D Model Requirements:**
- GLTF/GLB format
- Standard humanoid rig
- Expressive face controls
- Color materials for accents

---

### Anthropomorphic Cat Character
**Reference:** `bible/characters.md` - Anthropomorphic Cat Character

**Three.js Implementation:**
```javascript
const catCharacter = {
  type: 'anthropomorphic_cat',
  appearance: {
    posture: 'human_like',
    fur: 'detailed_texture',
    variant: 'white_available',
    eyes: 'expressive_closable',
    states: ['relaxed', 'sleeping', 'contemplative', 'curious', 'distressed']
  },
  materials: {
    fur: 'fur_shader',
    eyes: 'expressive_material'
  }
};
```

**Animation States:**
- Idle (relaxed)
- Sleeping (eyes closed)
- Contemplative
- Curious
- Distressed

---

## Environment Scenes

### Catbotica Industries Campus
**Reference:** `bible/worldbuilding.md` - Catbotica Industries

**Three.js Scene Setup:**
```javascript
const campusScene = {
  environment: {
    type: 'industrial_campus',
    buildings: 'multiple',
    spacing: 'open_spaces',
    signage: 'CAMPUS_prominent',
    style: 'retro_futuristic'
  },
  lighting: {
    ambient: 'dim',
    accent: 'neon',
    mood: 'industrial_creative'
  },
  materials: {
    buildings: 'industrial_metals',
    accents: 'neon_emissive',
    palette: 'dark_grays_neon'
  }
};
```

**Scene Components:**
- Multiple building models
- Neon signage
- Industrial equipment
- Open plaza areas
- Mechanical structures

---

### Space Environment
**Reference:** `bible/worldbuilding.md` - Space/Outer Space

**Three.js Scene Setup:**
```javascript
const spaceScene = {
  environment: {
    type: 'cosmic',
    background: 'star_field',
    scale: 'vast',
    features: ['debris_fields', 'meteor_hazards', 'spaceship_routes']
  },
  lighting: {
    stars: 'point_lights',
    spaceship: 'directional',
    mood: 'dramatic_shadows'
  },
  effects: {
    particles: 'star_field',
    debris: 'floating_objects',
    atmosphere: 'deep_space'
  }
};
```

**Three.js Implementation:**
- Use `THREE.Points` for star field
- Particle system for debris
- HDRI or procedural skybox
- Volumetric fog for depth

---

### Jungle/Forest Environment
**Reference:** `bible/worldbuilding.md` - Jungle/Forest

**Three.js Scene Setup:**
```javascript
const jungleScene = {
  environment: {
    type: 'natural_forest',
    density: 'dense_foliage',
    features: ['tall_trees', 'pathways', 'clearings', 'rivers', 'water_features']
  },
  lighting: {
    type: 'natural_sun',
    effect: 'dappled_through_trees',
    mood: 'adventure_exploration'
  },
  materials: {
    terrain: 'earth_tones',
    foliage: 'greens',
    water: 'reflective_transparent'
  }
};
```

**Three.js Implementation:**
- Instanced geometry for trees
- Foliage system for density
- Water shader for rivers
- Dynamic lighting (sun rays)
- Particle effects (insects)

---

## Interactive Elements

### Character Interactions
**Reference:** `bible/characters.md` - Character Relationships

**Implementation:**
```javascript
// Character interaction system
const characterInteractions = {
  industrialGroup: {
    participants: ['cat', 'dog'],
    setting: 'catbotica_campus',
    theme: 'everyone_has_a_story'
  },
  spaceExplorers: {
    participants: ['humanoid_space_explorer', 'cowboy_hat'],
    setting: 'spaceship',
    theme: 'team_collaboration'
  },
  jungleExpedition: {
    participants: ['cat', 'beetle_guide', 'dragonfly'],
    setting: 'jungle',
    theme: 'adventure_exploration'
  }
};
```

---

### Narrative Progression
**Reference:** `bible/timeline.md`

**Implementation:**
```javascript
// Timeline-based narrative system
const narrativeSystem = {
  events: [
    { page: 1, type: 'cover', character: 'robot' },
    { page: 2, type: 'spaceship_strike', character: 'space_explorer' },
    { page: 10, type: 'campus_intro', location: 'catbotica_campus' },
    { page: 13, type: 'everyone_has_story', theme: 'individual_narratives' },
    // ... more events
  ],
  progression: 'chronological',
  themes: ['exploration', 'relationships', 'storytelling', 'adventure']
};
```

---

## Material Definitions

### Retro-Futuristic Aesthetic
```javascript
const retroFuturisticMaterials = {
  metals: {
    type: 'MeshStandardMaterial',
    properties: {
      metalness: 0.8,
      roughness: 0.2,
      color: 0x888888
    }
  },
  neon: {
    type: 'MeshStandardMaterial',
    properties: {
      emissive: true,
      emissiveIntensity: 1.0,
      color: 0xff00ff // Example: purple neon
    }
  },
  plastics: {
    type: 'MeshStandardMaterial',
    properties: {
      metalness: 0.1,
      roughness: 0.3,
      color: 0xff00ff // Saturated colors
    }
  }
};
```

### Color Palettes
```javascript
const colorPalettes = {
  space: {
    background: 0x000011,
    stars: 0xffffff,
    accents: 0x0066ff
  },
  industrial: {
    base: 0x333333,
    accents: 0xff00ff, // Neon purple
    lighting: 0x00ffff // Neon cyan
  },
  natural: {
    terrain: 0x8b7355,
    foliage: 0x228b22,
    water: 0x4169e1
  },
  alien: {
    terrain: 0x8b7355,
    atmosphere: 0x0066ff,
    flora: 0x228b22
  }
};
```

---

## Scene Composition

### Camera Setup
```javascript
// Recommended camera settings
const cameraSettings = {
  type: 'PerspectiveCamera',
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000
};

// For space scenes: far = 10000
// For interior scenes: far = 100
```

### Lighting Setup
```javascript
// Scene lighting based on location
const lightingConfigs = {
  industrial: {
    ambient: { color: 0x222222, intensity: 0.3 },
    directional: { color: 0xffffff, intensity: 0.8, position: [10, 10, 5] },
    point: { color: 0xff00ff, intensity: 1.0, position: [0, 5, 0] } // Neon accent
  },
  space: {
    ambient: { color: 0x000011, intensity: 0.1 },
    point: { color: 0xffffff, intensity: 2.0, distance: 1000 } // Stars
  },
  jungle: {
    ambient: { color: 0xffffff, intensity: 0.5 },
    directional: { color: 0xffd700, intensity: 1.0, position: [5, 10, 5] }, // Sun
    spot: { color: 0xffffff, intensity: 0.5, angle: 0.3 } // Dappled light
  }
};
```

---

## Performance Optimization

### LOD (Level of Detail)
- High detail for close-up character interactions
- Medium detail for environment exploration
- Low detail for distant objects

### Instancing
- Use `THREE.InstancedMesh` for repeated objects (trees, buildings, stars)
- Reduce draw calls for dense scenes

### Culling
- Frustum culling for off-screen objects
- Occlusion culling for interior scenes

---

## Asset Organization

### File Structure
```
assets/
├── models/
│   ├── characters/
│   │   ├── robot.glb
│   │   ├── cat.glb
│   │   └── dog.glb
│   └── environments/
│       ├── campus.glb
│       ├── spaceship.glb
│       └── jungle.glb
├── textures/
│   ├── characters/
│   └── environments/
└── audio/
    ├── ambient/
    └── dialogue/
```

---

## Integration Checklist

- [ ] Load character models (GLTF/GLB)
- [ ] Set up environment scenes
- [ ] Apply materials (retro-futuristic aesthetic)
- [ ] Configure lighting (location-appropriate)
- [ ] Implement character interactions
- [ ] Add narrative progression system
- [ ] Optimize performance (LOD, instancing)
- [ ] Test across devices/browsers

---

## Quick Reference

**Character Models:** Reference `workflow/character-reference-cards.md`  
**Location Details:** Reference `workflow/location-briefs.md`  
**Full Bible:** Reference `bible/` directory  
**Style Guide:** Reference `workflow/comfyui-prompts.md` for aesthetic details

---

## Example Scene Loader

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Load Catbotica Campus scene
loader.load('assets/models/environments/campus.glb', (gltf) => {
  const scene = gltf.scene;
  
  // Apply materials
  scene.traverse((child) => {
    if (child.isMesh) {
      // Retro-futuristic materials
      child.material = retroFuturisticMaterials.metals;
    }
  });
  
  // Add to Three.js scene
  threeScene.add(scene);
  
  // Set up lighting
  setupIndustrialLighting();
});
```

---

## Notes

- Always reference `bible/worldbuilding.md` for accurate location details
- Use `bible/characters.md` for character specifications
- Check `bible/timeline.md` for narrative context
- Maintain retro-futuristic aesthetic throughout
- Match color palettes to location types
