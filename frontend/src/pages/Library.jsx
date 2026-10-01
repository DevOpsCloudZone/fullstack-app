import "./Catalog.css";

export default function LibraryPage({ savedItems, onToggleSaved, onBack }) {
  return <section className="catalog-page">
    <button className="tc-back-link" onClick={onBack}>← Back to Explore</button>
    <p className="tc-eyebrow">YOUR PERSONAL COLLECTION</p><h1>My Library</h1>
    <p className="catalog-intro">Keep products and movies here so you can return to them later.</p>
    {savedItems.length === 0 ? <div className="library-empty"><span>♡</span><h2>Your library is empty</h2><p>Open a product or movie and choose “Add to My Library” to save it here.</p></div> :
      <div className="library-list">{savedItems.map((item) => <article className="library-item" key={item.id}>
        {item.image && <img src={item.image} alt="" />}
        <div className="library-item-copy"><span className="catalog-kicker">{item.type === "movie" ? `${item.industry} · ${item.year}` : item.category}</span><h2>{item.name}</h2><p>{item.type === "movie" ? `${item.genre || ""} ${item.director ? `· Director: ${item.director}` : ""}` : item.price}</p></div>
        <button className="catalog-save remove-save" onClick={() => onToggleSaved(item)}>Remove</button>
      </article>)}</div>}
    <p className="catalog-note">For now, saved items are stored in this browser on this device. A later backend update can sync the library to your account across devices.</p>
  </section>;
}
