import { Link } from 'react-router-dom';
import { PageHero } from '../components/common';
export default function AboutPage() {
  return (
    <div>
      <PageHero label="OUR STORY" title="More Than Fabric — A Living Legacy" subtitle="For over four decades, we have been the bridge between Nigeria's master weavers and families who cherish authentic Aso Oke." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {[
          ['Born in the Weaving Towns of Yorubaland', 'Àṣọ Òkè Royale was founded in 2026 by Odere Kehinde in the historic weaving city of Iseyin, Oyo State. What began as a small family workshop connecting local weavers to markets in Lagos and Ibadan has grown into Nigeria\'s most trusted name in authentic Aso Oke. Odere Kehinde understood from childhood that Aso Oke was more than fabric — it was identity, memory, and cultural pride woven into every strip.'],
          ['The Art of Strip-Loom Weaving', 'Traditional Aso Oke is woven on narrow strip looms, with each strip typically 4 inches wide. Multiple strips are sewn together to create the final fabric. This process, unchanged for centuries, requires immense skill and patience — a single gele can take up to three days to complete. Our artisan partners in Iseyin, Ọṣogbo, and Ilorin use locally sourced silk, cotton, and metallic threads.'],
          ['Our Four Main Varieties', 'We specialise in four main varieties: Etu (dark indigo prestige fabric), Sanyan (natural silk, the most prestigious), Alaari (vibrant red ceremonial fabric), and Gele (head wrap fabric). Each tells a different story and carries a different cultural weight.'],
        ].map(([title, body]) => (
          <div key={title} className="mb-10 pb-10 border-b border-[#EDE0C0] last:border-0">
            <h2 className="font-serif text-2xl mb-4">{title}</h2>
            <p className="text-[#9B8B6E] leading-relaxed">{body}</p>
          </div>
        ))}
        <div className="text-center">
          <Link to="/shop" className="btn-primary">BROWSE OUR COLLECTION</Link>
        </div>
      </div>
    </div>
  );
}
