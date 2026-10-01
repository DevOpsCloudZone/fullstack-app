import { useMemo, useState } from "react";
import "./Catalog.css";

const movies = [
  { id:"movie-hollywood-1", type:"movie", industry:"Hollywood", name:"Interstellar", year:"2014", director:"Christopher Nolan", cast:"Matthew McConaughey, Anne Hathaway, Jessica Chastain", language:"English", genre:"Science fiction / Drama", runtime:"169 minutes", image:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900", synopsis:"A team travels beyond Earth in search of a future for humanity. This is a sample movie entry." },
  { id:"movie-tollywood-1", type:"movie", industry:"Tollywood", name:"Baahubali: The Beginning", year:"2015", director:"S. S. Rajamouli", cast:"Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah", language:"Telugu", genre:"Epic action / Fantasy", runtime:"Approx. 159 minutes", image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900", synopsis:"An epic fantasy story introducing a kingdom, its rivalries and a mysterious royal legacy." },
  { id:"movie-bollywood-1", type:"movie", industry:"Bollywood", name:"Dangal", year:"2016", director:"Nitesh Tiwari", cast:"Aamir Khan, Fatima Sana Shaikh, Sanya Malhotra", language:"Hindi", genre:"Sports / Drama", runtime:"Approx. 161 minutes", image:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900", synopsis:"A sports drama inspired by the journey of a wrestling coach and his daughters." },
  { id:"movie-kollywood-1", type:"movie", industry:"Kollywood", name:"Jai Bhim", year:"2021", director:"T. J. Gnanavel", cast:"Suriya, Lijomol Jose, Manikandan", language:"Tamil", genre:"Legal drama", runtime:"Approx. 164 minutes", image:"https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=900", synopsis:"A legal drama centered on a fight for justice and the rights of a marginalized community." }
];
const industries = ["All", "Hollywood", "Tollywood", "Bollywood", "Kollywood"];

export default function EntertainmentPage({ savedItems, onToggleSaved, onBack }) {
  const [industry, setIndustry] = useState("All");
  const [selected, setSelected] = useState(null);
  const shown = useMemo(() => movies.filter((m) => industry === "All" || m.industry === industry), [industry]);
  const isSaved = (item) => savedItems.some((saved) => saved.id === item.id);
  return <section className="catalog-page">
    <button className="tc-back-link" onClick={selected ? () => setSelected(null) : onBack}>← {selected ? "Back to movies" : "Back to Explore"}</button>
    <p className="tc-eyebrow">MOVIES & CULTURE</p><h1>{selected ? selected.name : "Entertainment"}</h1>
    <p className="catalog-intro">{selected ? selected.synopsis : "Explore movies by film industry, then open a title for its details."}</p>
    {selected ? <div className="catalog-detail movie-detail">
      <img src={selected.image} alt={`${selected.name} visual`} /><div><span className="catalog-kicker">{selected.industry} · {selected.year}</span><h2>{selected.name}</h2><p>{selected.synopsis}</p>
        <dl className="spec-grid"><div><dt>Director</dt><dd>{selected.director}</dd></div><div><dt>Cast</dt><dd>{selected.cast}</dd></div><div><dt>Language</dt><dd>{selected.language}</dd></div><div><dt>Genre</dt><dd>{selected.genre}</dd></div><div><dt>Runtime</dt><dd>{selected.runtime}</dd></div><div><dt>Release year</dt><dd>{selected.year}</dd></div></dl>
        <button className="tc-button tc-button-primary" onClick={() => onToggleSaved(selected)}>{isSaved(selected) ? "✓ Saved to My Library" : "＋ Add to My Library"}</button>
      </div>
    </div> : <>
      <div className="catalog-filters">{industries.map((item) => <button key={item} className={`catalog-filter ${industry === item ? "active" : ""}`} onClick={() => setIndustry(item)}>{item}</button>)}</div>
      <div className="catalog-grid">{shown.map((item) => <article className="catalog-card movie-card" key={item.id}><button className="catalog-image-button" onClick={() => setSelected(item)} aria-label={`View ${item.name}`}><img src={item.image} alt={`${item.name} visual`} /></button><div className="catalog-card-body"><span className="catalog-kicker">{item.industry} · {item.year}</span><h2>{item.name}</h2><p>{item.genre} · {item.language}</p><p className="movie-director">Director: {item.director}</p><div className="catalog-actions"><button className="tc-button tc-button-primary" onClick={() => setSelected(item)}>Movie details</button><button className="catalog-save" onClick={() => onToggleSaved(item)}>{isSaved(item) ? "♥ Saved" : "♡ Save"}</button></div></div></article>)}</div>
    </>}
  </section>;
}
