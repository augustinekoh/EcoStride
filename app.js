const App = () => {
  return (
    <div>
      <header>
        <img src="tree.jpg" alt="Minimalist Tree" className="hero-image" />
        <h1>EcoStride</h1>
        <p className="subtitle">
          Turn Every Step & Pedal into City Conquest and Real Rewards. Gamified green mobility for a smarter city.
        </p>
      </header>
      
      <main className="container">
        <h2 className="section-title">Why EcoStride?</h2>
        <p className="intro-text">
          Traditional "low-carbon" slogans lack intrinsic motivation. Local merchants struggle with high foot-traffic acquisition costs, and urban congestion remains high. EcoStride connects gamified exploration, local commerce, and civic engagement to drive genuine behavioral change.
        </p>
        
        <h2 className="section-title">Explore Features</h2>
        <div className="features-grid">
          <div className="feature-card" onClick={() => alert("Avatar & Customization feature coming soon!")}>
            <h3>Avatar & Worldview</h3>
            <p>Evolve your "Carbon-Neutral Sprite" as your carbon reduction grows. Unlock landmarks and trail signposts.</p>
          </div>
          <div className="feature-card" onClick={() => alert("Territory Conquest feature coming soon!")}>
            <h3>Territory Conquest</h3>
            <p>Join guilds, plant carbon trees, and claim "Oasis Zones" for exclusive merchant discounts.</p>
          </div>
          <div className="feature-card" onClick={() => alert("Seasonal Events feature coming soon!")}>
            <h3>Marathons & Trophies</h3>
            <p>Participate in virtual green marathons and collect handcrafted digital 3D medals.</p>
          </div>
          <div className="feature-card" onClick={() => alert("Civic Bounty feature coming soon!")}>
            <h3>Civic Bounty</h3>
            <p>Report urban issues through geo-tagging to earn Eco-Coins and help local government maintain the city.</p>
          </div>
          <div className="feature-card" onClick={() => alert("Green Economy feature coming soon!")}>
            <h3>Green Economy</h3>
            <p>Redeem Eco-Coins for merchant vouchers, transit discounts, or sponsor raffle entries.</p>
          </div>
        </div>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} EcoStride: Green Quest. All rights reserved.</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
