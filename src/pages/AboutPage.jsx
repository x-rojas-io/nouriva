import React from "react";

function AboutPage() {
  return (
    <div className="min-h-screen bg-lime-50 text-gray-800 px-6 py-10 space-y-12">
        {/* 🖼️ Hero Image */}
        <img
            src="https://res.cloudinary.com/dc7ktdccz/image/upload/v1753926088/irina-del-Mha5nyvZ2G4-unsplash_kxboao.jpg"
            alt="Colorful healthy food on table"
            className="w-full h-64 object-cover rounded-xl shadow mb-8"
        />
      

      {/* 1. Intro */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-emerald-700 mb-2">About Nouriva</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Nouriva is your companion for delicious, wholesome eating. Whether you're planning meals, finding healthy snacks, or just exploring new recipes — we're here to make better eating simple and satisfying.
        </p>
      </section>

      {/* 2. Philosophy */}
      <section className="bg-white rounded-xl p-6 shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Our Philosophy</h2>
        <p className="text-gray-700 text-base leading-relaxed">
          We believe in food that supports your lifestyle — rich in flavor, naturally nutrient-dense, and made from real ingredients. At Nouriva, we encourage habits that empower your body to function at its best. We don't offer medical advice, but we do promote thoughtful food choices rooted in science and simplicity.
        </p>
      </section>

      {/* 3. The Balanced Plate */}
      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-xl font-semibold text-emerald-600 mb-2">Protein</h3>
          <p className="text-gray-700 text-sm">
            Protein-rich foods support muscle repair, hormone balance, and long-lasting energy. Choose lean meats, fish, eggs, legumes, tofu, or yogurt — aim to include protein in every meal.
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-xl font-semibold text-emerald-600 mb-2">Healthy Fats</h3>
          <p className="text-gray-700 text-sm">
            Unsaturated fats from foods like avocados, olive oil, nuts, and seeds help your body absorb vitamins and support brain and heart health. Balanced fat intake is key to staying full and satisfied.
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-xl font-semibold text-emerald-600 mb-2">Vegetables</h3>
          <p className="text-gray-700 text-sm">
            Vegetables provide fiber, antioxidants, and essential nutrients. Eating a variety of colorful veggies helps support digestion, reduce inflammation, and maintain a healthy metabolism.
          </p>
        </div>
      </section>

      {/* 4. Tips & Resources */}
      <section className="bg-white rounded-xl p-6 shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Tips for Nourishing Meals</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
          <li>Plan meals with protein, fat, and fiber for sustained energy.</li>
          <li>Hydrate with water and herbal teas throughout the day.</li>
          <li>Eliminate ultra-processed foods and added sugars.</li>
          <li>Cook at home when possible — control ingredients, save money.</li>
          <li>Listen to your body's hunger and fullness cues.</li>
        </ul>
        <p className="mt-4 text-sm text-gray-500 italic">
          Source: <a href="https://food-guide.canada.ca/en/tips-for-healthy-eating/adults/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Canada’s Food Guide – Tips for Healthy Eating</a>
        </p>
      </section>

      {/* 5. Closing */}
      <section className="text-center max-w-2xl mx-auto">
        <p className="text-md text-gray-700">
          Nouriva is not a medical service. We aim to empower individuals to make food choices that align with their lifestyle and goals, inspired by guidance from trusted sources.
        </p>
      </section>
    </div>
  );
}

export default AboutPage;