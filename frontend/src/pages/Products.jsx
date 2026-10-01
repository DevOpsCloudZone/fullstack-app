import { useMemo, useState } from "react";
import "./Catalog.css";

export const products = [
  { id: "product-laptop-1", type: "product", category: "Laptops", name: "Performance Laptop", brand: "Example Series", price: "₹65,000–₹85,000", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900", processor: "Intel Core i5 / AMD Ryzen 5 (varies by model)", ram: "16 GB recommended", storage: "512 GB SSD recommended", display: "15.6-inch Full HD (example configuration)", battery: "Depends on model and workload", os: "Windows or Linux, model dependent", description: "A sample laptop listing for exploring specifications. Confirm exact configuration and current price with the seller." },
  { id: "product-mobile-1", type: "product", category: "Mobiles", name: "Everyday Smartphone", brand: "Example Series", price: "₹15,000–₹30,000", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900", processor: "Model-specific mobile chipset", ram: "6–8 GB example range", storage: "128–256 GB example range", display: "AMOLED or LCD depending on model", battery: "Typically model dependent; check charging specs", os: "Android or iOS, model dependent", description: "A sample smartphone listing. Specifications and price are illustrative, not a live offer." },
  { id: "product-earphones-1", type: "product", category: "Earphones", name: "Wireless Earphones", brand: "Example Audio", price: "₹1,000–₹5,000", image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900", processor: "Not applicable", ram: "Not applicable", storage: "Not applicable", display: "Not applicable", battery: "Check earbuds and case battery life", os: "Bluetooth compatible devices", description: "Compare fit, sound profile, microphone quality, codec support and battery life before buying." },
  { id: "product-headphones-1", type: "product", category: "Headphones", name: "Over-ear Headphones", brand: "Example Audio", price: "₹2,000–₹12,000", image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900", processor: "Not applicable", ram: "Not applicable", storage: "Not applicable", display: "Not applicable", battery: "Depends on wired or wireless model", os: "Bluetooth / 3.5 mm / USB, model dependent", description: "Consider comfort, active noise cancellation, microphone quality and connection type." },
  { id: "product-powerbank-1", type: "product", category: "Batteries & Power Banks", name: "Portable Power Bank", brand: "Example Power", price: "₹800–₹3,000", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=900", processor: "Not applicable", ram: "Not applicable", storage: "Not applicable", display: "Some models include a charge indicator", battery: "Compare capacity (mAh/Wh), output and charging speed", os: "Compatible with supported USB devices", description: "Check output wattage, supported charging standards, safety certifications and airline limits." }
];

const categories = ["All", "Laptops", "Mobiles", "Earphones", "Headphones", "Batteries & Power Banks"];

export default function ProductsPage({ savedItems, onToggleSaved, onBack }) {
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const shown = useMemo(() => products.filter((p) => category === "All" || p.category === category), [category]);
  const isSaved = (item) => savedItems.some((saved) => saved.id === item.id);

  return <section className="catalog-page">
    <button className="tc-back-link" onClick={selected ? () => setSelected(null) : onBack}>← {selected ? "Back to products" : "Back to Explore"}</button>
    <p className="tc-eyebrow">DEVICES & GADGETS</p>
    <h1>{selected ? selected.name : "Mobiles & Laptops"}</h1>
    <p className="catalog-intro">{selected ? selected.description : "Browse device categories and compare the specifications that matter to you."}</p>
    {selected ? <div className="catalog-detail">
      <img src={selected.image} alt={selected.name} />
      <div><span className="catalog-kicker">{selected.category} · {selected.brand}</span><h2>{selected.name}</h2><p className="catalog-price">{selected.price}</p>
        <p>{selected.description}</p><dl className="spec-grid">
          {["processor", "ram", "storage", "display", "battery", "os"].map((key) => <div key={key}><dt>{({processor:"Processor",ram:"RAM",storage:"Storage",display:"Display",battery:"Battery",os:"OS / Compatibility"})[key]}</dt><dd>{selected[key]}</dd></div>)}
        </dl>
        <button className="tc-button tc-button-primary" onClick={() => onToggleSaved(selected)}>{isSaved(selected) ? "✓ Saved to My Library" : "＋ Add to My Library"}</button>
        <p className="catalog-note">Prices and specifications are sample guidance, not live product data. Verify exact model details before purchasing.</p>
      </div>
    </div> : <>
      <div className="catalog-filters">{categories.map((item) => <button key={item} className={`catalog-filter ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="catalog-grid">{shown.map((item) => <article className="catalog-card" key={item.id}>
        <button className="catalog-image-button" onClick={() => setSelected(item)} aria-label={`View ${item.name}`}><img src={item.image} alt={item.name} /></button>
        <div className="catalog-card-body"><span className="catalog-kicker">{item.category}</span><h2>{item.name}</h2><p>{item.description}</p><strong className="catalog-price">{item.price}</strong>
          <div className="catalog-actions"><button className="tc-button tc-button-primary" onClick={() => setSelected(item)}>View details</button><button className="catalog-save" onClick={() => onToggleSaved(item)}>{isSaved(item) ? "♥ Saved" : "♡ Save"}</button></div>
        </div></article>)}</div>
    </>}
  </section>;
}
