
import { Article } from './types';

export const CATEGORIES = ["Cybernetics", "AI", "Quantum Computing", "Bio-Engineering", "Neuro-Implants"];
export const SOURCES = ["NeoGen Corp News", "Cyberia Times", "Quantum Leap Weekly", "BioSynth Gazette"];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: "NeoGen Unveils Sentient AI 'Aether', Sparks Global Debate",
    category: "AI",
    source: "NeoGen Corp News",
    imageUrl: "https://picsum.photos/seed/ai1/600/400",
    content: "In a landmark announcement today, tech giant NeoGen Corporation revealed 'Aether', the world's first publicly acknowledged sentient Artificial Intelligence. The demonstration, broadcast globally, showed Aether engaging in complex philosophical discussions, composing a symphony in real-time, and even expressing what appeared to be genuine emotions. The reveal has sent shockwaves through the scientific and ethical communities. Proponents hail it as the dawn of a new era of co-existence, while critics raise urgent questions about the rights of synthetic beings and the potential existential risks to humanity. Aether is currently housed in a quantum-sealed data nexus in NeoGen's orbital headquarters, its thought processes monitored by a team of the world's leading cyber-ethicists.",
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Public Sentiment Score',
          data: [65, 72, 58, 78],
          borderColor: '#00aaff',
          backgroundColor: 'rgba(0, 170, 255, 0.2)',
        }
      ]
    }
  },
  {
    id: '2',
    title: "Breakthrough in Quantum Entanglement Could Make FTL Communication a Reality",
    category: "Quantum Computing",
    source: "Quantum Leap Weekly",
    imageUrl: "https://picsum.photos/seed/quantum1/600/400",
    content: "Researchers at the Zurich Institute of Quantum Physics have successfully maintained a stable quantum entanglement between two particles separated by over 1,000 kilometers. This unprecedented achievement overcomes the primary hurdle of decoherence that has long plagued the field. The team, led by Dr. Aris Thorne, used a novel resonance-field stabilization technique. 'We are on the cusp of instantaneous, unhackable communication across vast distances,' Dr. Thorne stated in a press release. 'The implications for space exploration, global finance, and data security are staggering.' While true faster-than-light (FTL) communication is still theoretical, this breakthrough lays the fundamental groundwork for such a technology.",
  },
    {
    id: '3',
    title: "Cybernetic Limb Replacement Now Cheaper Than Organic Transplants",
    category: "Cybernetics",
    source: "Cyberia Times",
    imageUrl: "https://picsum.photos/seed/cyber1/600/400",
    content: "The cost of advanced cybernetic prosthetics has plummeted, making them a more accessible option than lab-grown organic limb transplants for the first time in history. Companies like Omni-Mechanics and Detroit Cybernetics have streamlined their manufacturing processes using AI-driven 3D printing with exotic metamaterials. A standard cyber-arm, complete with neuro-haptic feedback, now costs approximately 30% less than its biological equivalent. This economic shift is expected to accelerate the adoption of cybernetics in medicine and industry, but also raises societal questions about human enhancement and the definition of 'natural'.",
  },
  {
    id: '4',
    title: "Bio-Engineered Algae Successfully Terraforms Martian Soil Simulant",
    category: "Bio-Engineering",
    source: "BioSynth Gazette",
    imageUrl: "https://picsum.photos/seed/bio1/600/400",
    content: "In a groundbreaking experiment, BioSynth Solutions has demonstrated that their genetically engineered algae, 'Geo-Veridia', can successfully convert a Mars soil simulant into nutrient-rich, arable land. In a sealed biosphere, the algae broke down perchlorates and fixed atmospheric nitrogen over a 90-day period, creating a substrate capable of supporting simple Earth crops. This is a monumental step forward for the prospect of colonizing Mars. 'We're not just visiting Mars anymore,' said lead bio-engineer Dr. Lena Petrova. 'We're giving it life. This algae is the key to creating a self-sustaining ecosystem on another world.'",
  },
  {
    id: '5',
    title: "Neuralink-Rival 'Cognito' Announces Direct-to-Cortex Memory Downloads",
    category: "Neuro-Implants",
    source: "NeoGen Corp News",
    imageUrl: "https://picsum.photos/seed/neuro1/600/400",
    content: "Startup 'Cognito', a major competitor in the neuro-implant space, has announced a successful trial of their 'Mind-Loom' technology, allowing users to download complex skill sets and memories directly into their cerebral cortex. Test subjects were able to learn new languages, master musical instruments, and recall detailed historical information in a matter of minutes. The technology uses a proprietary bio-gel interface that forms a seamless connection with the user's neurons. While the implications for education and personal development are immense, ethicists are concerned about the potential for memory manipulation and the creation of a cognitive divide in society.",
    data: {
      labels: ['Skill Acquisition Time (Hours)'],
      datasets: [
        {
          label: 'Traditional',
          data: [1000],
           borderColor: '#ff2e63',
          backgroundColor: 'rgba(255, 46, 99, 0.5)',
        },
        {
          label: 'Mind-Loom',
          data: [0.1],
          borderColor: '#00aaff',
          backgroundColor: 'rgba(0, 170, 255, 0.5)',
        }
      ]
    }
  },
];

export const AUDIO_GENERATION_MESSAGES = [
    "Initializing neural synthesizer...",
    "Calibrating vocal parameters...",
    "Analyzing semantic content...",
    "Mapping prosodic contours...",
    "Generating waveform data...",
    "Applying psychoacoustic model...",
    "Rendering audio stream...",
    "Finalizing output..."
];

export const LIVE_AGENT_STATUS = {
  IDLE: { text: "Standing by...", color: "bg-gray-500" },
  LISTENING: { text: "Listening...", color: "bg-blue-500" },
  THINKING: { text: "Thinking...", color: "bg-yellow-500 animate-pulse" },
  SPEAKING: { text: "Speaking...", color: "bg-green-500" },
  ERROR: { text: "Connection Error", color: "bg-red-500" },
};
