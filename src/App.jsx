import { useState } from 'react'

const UVT = 47000; // Valor UVT 2024, actualiza si es necesario

function calcularMeses(d1, d2) {
  // d1: fecha límite, d2: fecha presentación
  let [y1, m1, day1] = d1.split('-').map(Number);
  const [y2, m2, day2] = d2.split('-').map(Number);
  // Determinar si la fecha límite es el último día del mes
  const ultimoDiaMes = new Date(y1, m1, 0).getDate();
  if (day1 === ultimoDiaMes) {
    // Si es el último día del mes, pasar al primer día del mes siguiente
    day1 = 1;
    m1 += 1;
    if (m1 > 12) {
      m1 = 1;
      y1 += 1;
    }
  }
  // Si está en el mismo mes y año, pero después del día límite, cuenta 1 mes
  if (y2 === y1 && m2 === m1) return 1;
  // Si está en meses posteriores
  let meses = (y2 - y1) * 12 + (m2 - m1);
  // Si el día de presentación es después del día límite, suma 1 mes más 
  return meses + 1;
}

function calcularSancion({ fechaLimite, fechaPresentacion, emplazamiento, impuesto, ingresos, patrimonio, saldoFavor }, uvt = UVT) {
  const todosCero = Number(impuesto) === 0 && Number(ingresos) === 0 && Number(patrimonio) === 0;
  if (todosCero) {
    return 10 * uvt;
  }
  const meses = calcularMeses(fechaLimite, fechaPresentacion);
  console.log(`Meses de retraso: ${meses}`);
  let sancion = 10 * uvt;
  // Cálculo de sanción según condiciones
  if (Number(impuesto) > 0) {
    if (emplazamiento === 'no') {
      sancion = 0.05 * impuesto * meses;
      const max = impuesto * 1.0;
      sancion = sancion > max ? max : sancion;
    } else {
      sancion = 0.10 * impuesto * meses;
      const max = impuesto * 2.0;
      sancion = sancion > max ? max : sancion;
    }
  } else if (Number(impuesto) === 0 && emplazamiento === 'no' && Number(ingresos) > 0) {
    sancion = 0.005 * ingresos * meses;
    const max1 = 0.05 * ingresos;
    const max2 = 2 * Number(saldoFavor);
    const max3 = 2500 * uvt;
    const tope = Math.min(max1, max2 > 0 ? max2 : Infinity, max3);
    sancion = sancion > tope ? tope : sancion;
  } else if (Number(impuesto) === 0 && emplazamiento === 'si' && Number(ingresos) > 0) {
    sancion = 0.01 * ingresos * meses;
    const max1 = 0.10 * ingresos;
    const max2 = 4 * Number(saldoFavor);
    const max3 = 5000 * uvt;
    const tope = Math.min(max1, max2 > 0 ? max2 : Infinity, max3);
    sancion = sancion > tope ? tope : sancion;
  } else if (Number(impuesto) === 0 && Number(ingresos) === 0 && Number(patrimonio) > 0 && emplazamiento === 'no') {
    sancion = 0.01 * patrimonio * meses;
    const max1 = 0.10 * patrimonio;
    const max2 = 2 * Number(saldoFavor);
    const max3 = 2500 * uvt;
    const tope = Math.min(max1, max2 > 0 ? max2 : Infinity, max3);
    sancion = sancion > tope ? tope : sancion;
  } else if (Number(impuesto) === 0 && Number(ingresos) === 0 && Number(patrimonio) > 0 && emplazamiento === 'si') {
    sancion = 0.02 * patrimonio * meses;
    const max1 = 0.20 * patrimonio;
    const max2 = 4 * Number(saldoFavor);
    const max3 = 5000 * uvt;
    const tope = Math.min(max1, max2 > 0 ? max2 : Infinity, max3);
    sancion = sancion > tope ? tope : sancion;
  }
  // Sanción mínima 10 UVT
  if (sancion < 10 * uvt) {
    sancion = 10 * uvt;
  }
  return sancion;
}

function App() {
  const [form, setForm] = useState({
    fechaLimite: '',
    fechaPresentacion: '',
    emplazamiento: 'no',
    impuesto: 0,
    ingresos: 0,
    patrimonio: 0,
    saldoFavor: 0,
    uvt: UVT,
    descuento: 0,
  });
  const [resultado, setResultado] = useState(null);
  const [descuentoVisual, setDescuentoVisual] = useState('0%');
  const [valorDescuento, setValorDescuento] = useState(0);
  const [sancionSinDescuento, setSancionSinDescuento] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'descuento') {
      if (value === '25') {
        setDescuentoVisual('75%');
      } else if (value === '50') {
        setDescuentoVisual('50%');
      } else {
        setDescuentoVisual('0%');
      }
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  // Elimina el comportamiento por defecto del formulario para evitar el refresco
  const handleSubmit = e => {
    e.preventDefault();
    calcularYMostrarSancion();
  };

  // Calcula y muestra la sanción sin refrescar la página
  const calcularYMostrarSancion = () => {
    setResultado(null);
    setMensaje("");
    setTimeout(() => {
      const uvtValue = Number(form.uvt) > 0 ? Number(form.uvt) : UVT;
      // Nueva condición: si la fecha de presentación es menor o igual a la fecha límite, no hay sanción
      if (form.fechaPresentacion && form.fechaLimite && new Date(form.fechaPresentacion) <= new Date(form.fechaLimite)) {
        setResultado(0);
        setValorDescuento(0);
        setSancionSinDescuento(0);
        setMensaje("No se genera sanción porque la declaración fue presentada antes o en la fecha límite.");
        return;
      }
      let sancion = calcularSancion({
        ...form,
        impuesto: Number(form.impuesto),
        ingresos: Number(form.ingresos),
        patrimonio: Number(form.patrimonio),
        saldoFavor: Number(form.saldoFavor),
        uvt: uvtValue,
      }, uvtValue);
      setSancionSinDescuento(sancion);
      let descuento = Number(form.descuento);
      let valorDescuentoCalc = 0;
      if (descuento === 25) {
        valorDescuentoCalc = sancion * 0.25;
        sancion = sancion * 0.75;
      } else if (descuento === 50) {
        valorDescuentoCalc = sancion * 0.5;
        sancion = sancion * 0.5;
      }
      // Si la sanción con descuento es menor a 10 UVT, se ajusta a 10 UVT
      if (sancion < 10 * uvtValue) {
        valorDescuentoCalc = 0;
        sancion = 10 * uvtValue;
      }
      setValorDescuento(valorDescuentoCalc);
      setResultado(sancion);
      setMensaje("");
    }, 0);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 500, width: '100%', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32, borderRadius: 18, border: '1px solid #e5e7eb' }}>
        <h2 style={{ textAlign: 'center', color: '#2563eb', marginBottom: 24, fontWeight: 700, letterSpacing: 1 }}>Cálculo Sanción por Extemporaneidad</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontWeight: 500, color: '#374151' }}>Fecha límite de presentación:<br />
              <input type="date" name="fechaLimite" value={form.fechaLimite} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>¿En estado de emplazamiento?:<br />
              <select name="emplazamiento" value={form.emplazamiento} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Impuesto a cargo:<br />
              <input type="number" name="impuesto" value={form.impuesto} onChange={handleChange} min="0" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Patrimonio declarado año anterior:<br />
              <input type="number" name="patrimonio" value={form.patrimonio} onChange={handleChange} min="0" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Valor UVT:<br />
              <input type="number" name="uvt" value={form.uvt} onChange={handleChange} min="1" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontWeight: 500, color: '#374151' }}>Fecha de presentación real:<br />
              <input type="date" name="fechaPresentacion" value={form.fechaPresentacion} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Ingresos declarados:<br />
              <input type="number" name="ingresos" value={form.ingresos} onChange={handleChange} min="0" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Saldo a favor:<br />
              <input type="number" name="saldoFavor" value={form.saldoFavor} onChange={handleChange} min="0" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
            </label>
            <label style={{ fontWeight: 500, color: '#374151' }}>Descuento sobre sanción:<br />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <select name="descuento" value={form.descuento} onChange={handleChange} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                  <option value="0">0%</option>
                  <option value="25">25%</option>
                  <option value="50">50%</option>
                </select>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{descuentoVisual}</span>
              </div>
            </label>
            <button
              type="button"
              onClick={calcularYMostrarSancion}
              style={{
                gridColumn: '1 / span 2',
                background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontSize: 18,
                marginTop: 8,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                width: '100%'
              }}
            >
              Calcular sanción
            </button>
          </div>
        </form>
        {mensaje && (
          <div style={{ marginTop: 32, background: '#fef9c3', color: '#92400e', padding: 18, borderRadius: 10, border: '1px solid #fde68a', fontWeight: 600, fontSize: 17, textAlign: 'center' }}>
            {mensaje}
          </div>
        )}
        {resultado !== null && resultado > 0 && (
          <div style={{ marginTop: 32, background: 'linear-gradient(90deg, #f0fdfa 0%, #e0e7ff 100%)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(37,99,235,0.06)', border: '1px solid #cbd5e1', fontSize: 18 }}>
            <div style={{ marginBottom: 8 }}><strong style={{ color: '#2563eb' }}>Sanción sin descuento: </strong><span style={{ color: '#334155' }}>${sancionSinDescuento.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span></div>
            <div style={{ marginBottom: 8 }}><strong style={{ color: '#2563eb' }}>Valor del descuento: </strong><span style={{ color: '#334155' }}>${valorDescuento.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span></div>
            <div><strong style={{ color: '#16a34a' }}>Sanción calculada: </strong><span style={{ color: '#16a34a', fontWeight: 700, fontSize: 22 }}>${resultado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
