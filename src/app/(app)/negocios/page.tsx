export default function NegociosPage() {
    return (
        <div style={{ minHeight: '100dvh', background: '#0c0a08', fontFamily: "'Poppins', sans-serif", padding: '0 0 20px' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 16px', height: '52px',
                background: 'rgba(12,10,8,0.92)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
            }}>
                <span style={{ fontSize: '1.1rem', color: '#d4a017' }}>🏪</span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Negocios</span>
            </header>
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
                <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 8px' }}>
                    Directorio de negocios
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', margin: '0 0 24px', lineHeight: 1.6 }}>
                    Aquí podrás publicar y descubrir emprendimientos de los miembros del elenco.
                </p>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(212,160,23,0.1)',
                    border: '1px solid rgba(212,160,23,0.25)',
                    borderRadius: '20px', padding: '8px 20px',
                    color: '#d4a017', fontSize: '0.8rem', fontWeight: 500,
                }}>
                    Próximamente
                </div>
            </div>
        </div>
    );
}
