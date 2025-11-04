import React, { useEffect, useMemo, useState } from "react";



// ---- Простая тема (без Tailwind) ----

const S: Record<string, React.CSSProperties> = {

  page: { fontFamily: "Inter, system-ui, sans-serif", background: "#000", color: "#fff", minHeight: "100vh" },

  container: { maxWidth: 960, margin: "0 auto", padding: "16px" },

  header: { position: "sticky", top: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(250,204,21,.4)", zIndex: 10 },

  h1: { fontSize: 24, fontWeight: 900, margin: 0 },

  pill: { background: "#FACC15", color: "#000", fontWeight: 800, borderRadius: 12, padding: "4px 8px", fontSize: 12 },

  btnY: { background: "#FACC15", color: "#000", border: "none", borderRadius: 14, padding: "10px 14px", fontWeight: 700, cursor: "pointer" },

  btnGhost: { background: "transparent", color: "#fff", border: "1px solid #2b2b2b", borderRadius: 12, padding: "8px 12px", cursor: "pointer" },

  chip: { background: "#0f0f0f", border: "1px solid #2b2b2b", color: "#fff", padding: "8px 12px", borderRadius: 12, cursor: "pointer", width: "100%" },

  chipActive: { background: "#FACC15", color: "#000", border: "1px solid #FACC15" },

  input: { background: "#0f0f0f", color: "#fff", border: "1px solid #2b2b2b", borderRadius: 10, padding: "10px 12px", width: "100%", boxSizing: "border-box" },

  card: { background: "#0b0b0b", border: "1px solid #1f1f1f", borderRadius: 16, padding: 16 },

  label: { fontSize: 12, color: "#aaaaaa", marginBottom: 4 },

  footer: { borderTop: "1px solid rgba(250,204,21,.3)", marginTop: 24, padding: "16px 0", color: "#aaa", fontSize: 14 },

};



const CATEGORIES = [

  { id: "sell", label: "Продам" },

  { id: "rent", label: "Сдам" },

  { id: "buy", label: "Куплю" },

  { id: "giveaway", label: "Отдам" },

  { id: "exchange", label: "Обмен" },

  { id: "delivery", label: "Доставка" },

  { id: "courier", label: "Курьер" },

] as const;



type CategoryId = typeof CATEGORIES[number]["id"];



type Listing = {

  id: string;

  title?: string;

  description?: string;

  category: CategoryId;

  name: string;

  address: string;

  phone: string;

  price?: string;

  createdAt: number;

  images?: string[]; // прикреплённые фото

};



type ChatMessage = {

  id: string;

  listingId: string;

  author: string;

  text: string;

  timestamp: number;

  imageData?: string;

};



const STORAGE_KEY = "classifieds:listings:v1";

const CHAT_KEY = "classifieds:chats:v1";

const OWNER_KEY = "classifieds:owners:v1";

const USER_KEY = "classifieds:userId:v1";



const loadListings = (): Listing[] => {

  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }

};

const saveListings = (items: Listing[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {} };



const loadChats = (): Record<string, ChatMessage[]> => {

  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "{}"); } catch { return {}; }

};

const saveChats = (chats: Record<string, ChatMessage[]>) => { try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); } catch {} };



const loadOwners = (): Record<string, string> => {

  try { return JSON.parse(localStorage.getItem(OWNER_KEY) || "{}"); } catch { return {}; }

};

const saveOwners = (owners: Record<string, string>) => { try { localStorage.setItem(OWNER_KEY, JSON.stringify(owners)); } catch {} };



const getOrCreateUserId = (): string => {

  let id = localStorage.getItem(USER_KEY);

  if (!id) { id = crypto.randomUUID(); localStorage.setItem(USER_KEY, id); }

  return id;

};



const phoneValid = (v: string) => /^(\+)?[0-9][0-9\s\-()]{6,}$/.test(v.trim());



type View = { mode: "home" } | { mode: "cat"; cat: CategoryId } | { mode: "my" };



// антиспам: 5 сообщений за 30 секунд

function canSendMessage(listingId: string, author: string) {

  const key = `rate:${listingId}:${author}`;

  const raw = localStorage.getItem(key);

  const now = Date.now();

  let arr: number[] = [];

  try { arr = raw ? JSON.parse(raw) : []; } catch {}

  arr = arr.filter(t => now - t < 30000);

  const allowed = arr.length < 5;

  return { allowed, arr, key, now };

}



export default function App() {

  const [userId] = useState(() => getOrCreateUserId());

  const [items, setItems] = useState<Listing[]>([]);

  const [owners, setOwners] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");

  const [newOpen, setNewOpen] = useState(false);

  const [fixedCategory, setFixedCategory] = useState<CategoryId | undefined>(undefined);

  const [view, setView] = useState<View>({ mode: "home" });



  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  const [chatOpenFor, setChatOpenFor] = useState<Listing | null>(null);



  const [editOpenFor, setEditOpenFor] = useState<Listing | null>(null);



  useEffect(() => { setItems(loadListings()); setChats(loadChats()); setOwners(loadOwners()); }, []);

  useEffect(() => { saveListings(items); }, [items]);

  useEffect(() => { saveChats(chats); }, [chats]);

  useEffect(() => { saveOwners(owners); }, [owners]);



  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase();

    return items

      .filter(i => {
        if (view.mode === 'cat') return i.category === view.cat;
        if (view.mode === 'my') return isOwner(i.id);
        return true;
      })

      .filter(i => q ? [i.title, i.description, i.address, i.name].join(' ').toLowerCase().includes(q) : true)

      .sort((a,b) => b.createdAt - a.createdAt);

  }, [items, query, view, userId, owners]);



  const isOwner = (listingId: string) => owners[listingId] === userId;



  const onDelete = (id: string) => {

    if (!isOwner(id)) return; // защита

    setItems(prev => prev.filter(i => i.id !== id));

    setOwners(prev => {

      const copy = { ...prev };

      delete copy[id];

      return copy;

    });

  };



  const openNew = (cat?: CategoryId) => { setFixedCategory(cat); setNewOpen(true); };

  const openChat = (it: Listing) => setChatOpenFor(it);



  const sendChat = (listingId: string, author: string, text: string, imageData?: string) => {

    setChats(prev => {

      const arr = prev[listingId] ? [...prev[listingId]] : [];

      arr.push({ id: crypto.randomUUID(), listingId, author, text, timestamp: Date.now(), imageData });

      return { ...prev, [listingId]: arr };

    });

  };



  const onEditSave = (updated: Listing) => {

    if (!isOwner(updated.id)) return;

    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));

    setEditOpenFor(null);

  };



  return (

    <div style={S.page}>

      <div style={{...S.header}}>

        <div style={{...S.container, display:'flex', gap:8, alignItems:'center', padding:'12px 16px'}}>

          <h1 style={S.h1}>ЧёПочём</h1>



          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>

            <button onClick={()=>setView({mode:'my'})} style={{...S.btnGhost, fontSize: 13, padding: '8px 12px' }}>Мои объявления</button>

            <button onClick={()=>openNew(view.mode==='cat'? view.cat: undefined)} style={{...S.btnY, fontSize: 13, padding: '8px 12px' }}>Новое объявление</button>

          </div>

        </div>

        <div style={{...S.container, paddingBottom:12}}>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            <div style={{ display:'flex', flexDirection:'column', gap:10, width: '100%' }}>

              <Chip active={view.mode==='home'} onClick={()=>setView({mode:'home'})} style={{ padding: '12px 16px', fontSize: 14 }}>Все</Chip>

              {CATEGORIES.map(c => (

                <Chip key={c.id} active={view.mode==='cat' && view.cat===c.id} onClick={()=>setView({mode:'cat', cat:c.id})} style={{ padding: '12px 16px', fontSize: 14 }}>{c.label}</Chip>

              ))}

            </div>

            <div style={{ width: '100%', marginTop: 12 }}>

              <input placeholder={view.mode==='cat'? `Поиск в категории "${labelById((view as any).cat)}"…` : view.mode === 'my' ? 'Поиск в моих объявлениях...' : 'Поиск по объявлениям...'} value={query} onChange={e=>setQuery(e.target.value)} style={S.input} />

            </div>

          </div>

        </div>

      </div>



      <main style={S.container}>

        {view.mode === 'cat' ? (

          <CategoryView

            cat={view.cat}

            items={filtered}

            onNew={()=>openNew(view.cat)}

            onDelete={onDelete}

            onChat={openChat}

            onEdit={(it)=> setEditOpenFor(it)}

            canManage={(id)=> isOwner(id)}

          />

        ) : view.mode === 'my' ? (

          filtered.length === 0 ? (

            <div style={{ textAlign:'center', padding:'64px 0' }}>

              <div style={{ border:'2px dashed rgba(250,204,21,.6)', borderRadius:999, display:'inline-block', padding:20 }}>📝</div>

              <h2 style={{ marginTop:16, fontSize:22, fontWeight:900 }}>У вас пока нет объявлений</h2>

              <p style={{ opacity:.8, maxWidth:460, margin:'8px auto' }}>Создайте первое объявление.</p>

              <button onClick={()=>openNew(undefined)} style={{ ...S.btnY, marginTop:12 }}>Новое объявление</button>

            </div>

          ) : (

            <div>

              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>

                <span style={{...S.pill, padding:'2px 8px'}}>МОИ ОБЪЯВЛЕНИЯ</span>

                <h2 style={{ margin:0, fontSize:22, fontWeight:900 }}>Всего: {filtered.length}</h2>

              </div>

              <Grid>

                {filtered.map(it => (

                  <Card

                    key={it.id}

                    it={it}

                    canManage={true}

                    onDelete={onDelete}

                    onEdit={()=>setEditOpenFor(it)}

                    onChat={()=>openChat(it)}

                  />

                ))}

              </Grid>

            </div>

          )

        ) : (

          filtered.length === 0 ? (

            <EmptyState onNew={()=>openNew(undefined)} />

          ) : (

            <Grid>

              {filtered.map(it => (

                <Card

                  key={it.id}

                  it={it}

                  canManage={isOwner(it.id)}

                  onDelete={onDelete}

                  onEdit={()=>setEditOpenFor(it)}

                  onChat={()=>openChat(it)}

                />

              ))}

            </Grid>

          )

        )}

      </main>



      <NewListingModal

        open={newOpen}

        fixedCategory={fixedCategory}

        onClose={()=>setNewOpen(false)}

        onSubmit={(payload)=>{

          const newItem: Listing = { id: crypto.randomUUID(), createdAt: Date.now(), ...payload };

          setItems(prev=>[newItem, ...prev]);

          setOwners(m=>({ ...m, [newItem.id]: userId }));

          setNewOpen(false);

        }}

      />



      <EditListingModal

        open={!!editOpenFor}

        listing={editOpenFor}

        onClose={()=>setEditOpenFor(null)}

        onSubmit={onEditSave}

      />



      <ChatModal

        open={!!chatOpenFor}

        listing={chatOpenFor}

        messages={chatOpenFor ? (chats[chatOpenFor.id]||[]) : []}

        onClose={()=>setChatOpenFor(null)}

        onSend={(author, text, img)=> chatOpenFor && sendChat(chatOpenFor.id, author, text, img)}

        sellerOnline={true} // индикатор оставим зелёным, без "режима продавца"

      />




    </div>

  );

}



function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: ()=>void }) {

  return (

    <button onClick={onClick} style={{ ...S.chip, ...(active? S.chipActive : {}) }}>{children}</button>

  );

}



function Grid({ children }: { children: React.ReactNode }) {

  return (

    <div style={{ display:'grid', gap:12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>{children}</div>

  );

}



function Card({ it, canManage, onDelete, onEdit, onChat }: { it: Listing; canManage: boolean; onDelete: (id: string)=>void; onEdit: ()=>void; onChat: ()=>void }) {

  return (

    <div style={S.card}>

      {it.images?.[0] && (

        <img

          src={it.images[0]}

          alt="фото"

          style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:12, marginBottom:10, border:'1px solid #1f1f1f' }}

        />

      )}

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>

        <span style={{...S.pill, padding:'2px 8px', fontWeight:800}}>{labelById(it.category)}</span>

        <span style={{ fontSize:12, color:'#aaa' }}>{new Date(it.createdAt).toLocaleString()}</span>

      </div>

      <div style={{ fontWeight:800, fontSize:16 }}>{it.title?.trim() || "Объявление без названия"}</div>

      {it.description && <div style={{ opacity:.9, marginTop:6, whiteSpace:'pre-wrap' }}>{it.description}</div>}



      <div style={{ display:'grid', gap:8, marginTop:12, fontSize:14 }}>

        <InfoRow label="Имя" value={it.name} />

        <InfoRow label="Адрес" value={it.address} />

        <InfoRow label="Телефон" value={it.phone} />

        {it.price && <InfoRow label="Цена" value={it.price} />}

      </div>



      <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, gap:8 }}>

        <button onClick={onChat} style={S.btnY}>💬 Чат с продавцом</button>

        {canManage && (

          <div style={{ display:'flex', gap:8 }}>

            <button onClick={onEdit} style={S.btnGhost}>Редактировать</button>

            <button onClick={()=>onDelete(it.id)} style={S.btnGhost}>Удалить</button>

          </div>

        )}

      </div>

    </div>

  );

}



function InfoRow({ label, value }: { label: string; value: string }) {

  return (

    <div style={{ background:'#0f0f0f', border:'1px solid #2b2b2b', borderRadius:12, padding:'8px 12px' }}>

      <span style={{ color:'#aaa' }}>{label}: </span>

      <b>{value}</b>

    </div>

  );

}



function labelById(id: CategoryId) { return CATEGORIES.find(c=>c.id===id)?.label || id; }



function EmptyState({ onNew }: { onNew: ()=>void }) {

  return (

    <div style={{ textAlign:'center', padding:'64px 0' }}>

      <div style={{ border:'2px dashed rgba(250,204,21,.6)', borderRadius:999, display:'inline-block', padding:20 }}>🟡</div>

      <h2 style={{ marginTop:16, fontSize:22, fontWeight:900 }}>Пока пусто</h2>

      <p style={{ opacity:.8, maxWidth:460, margin:'8px auto' }}>Создайте первое объявление.</p>

      <button onClick={onNew} style={{ ...S.btnY, marginTop:12 }}>Новое объявление</button>

    </div>

  );

}



function CategoryView({ cat, items, onNew, onDelete, onChat, onEdit, canManage }: {

  cat: CategoryId; items: Listing[]; onNew: ()=>void;

  onDelete: (id:string)=>void; onChat: (it: Listing)=>void; onEdit: (it: Listing)=>void;

  canManage: (id:string)=>boolean;

}) {

  return (

    <div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>

        <span style={{...S.pill, padding:'2px 8px'}}>КАТЕГОРИЯ</span>

        <h2 style={{ margin:0, fontSize:22, fontWeight:900 }}>{labelById(cat)}</h2>

        <div style={{ marginLeft:'auto' }}>

          <button onClick={onNew} style={S.btnY}>Создать в «{labelById(cat)}»</button>

        </div>

      </div>



      {items.length === 0 ? (

        <div style={{ ...S.card, border:'1px dashed rgba(250,204,21,.4)', color:'#bbb' }}>В этой категории пока нет объявлений. Будьте первым!</div>

      ) : (

        <Grid>

          {items.map(it => (

            <Card

              key={it.id}

              it={it}

              canManage={canManage(it.id)}

              onDelete={onDelete}

              onEdit={()=>onEdit(it)}

              onChat={()=>onChat(it)}

            />

          ))}

        </Grid>

      )}

    </div>

  );

}



function NewListingModal({ open, onClose, onSubmit, fixedCategory }: {

  open: boolean; onClose: ()=>void;

  onSubmit: (p: Omit<Listing, 'id'|'createdAt'>)=>void;

  fixedCategory?: CategoryId;

}) {

  const [form, setForm] = useState({

    title: "", description: "",

    category: fixedCategory ?? CATEGORIES[0].id as CategoryId,

    name: "", address: "", phone: "", price: "",

    images: [] as string[],

  });

  const [errors, setErrors] = useState<Record<string,string>>({});



  useEffect(()=>{ if(open){ setForm(f=>({ ...f, category: fixedCategory ?? f.category })); setErrors({}); }}, [open, fixedCategory]);



  const validate = () => {

    const e: Record<string,string> = {};

    if(!form.name.trim()) e.name = 'Укажите имя';

    if(!form.address.trim()) e.address = 'Укажите адрес';

    if(!form.phone.trim()) e.phone = 'Укажите телефон';

    if(form.phone && !phoneValid(form.phone)) e.phone = 'Некорректный номер';

    setErrors(e); return Object.keys(e).length===0;

  };



  const submit = (ev: React.FormEvent) => {

    ev.preventDefault(); if(!validate()) return;

    onSubmit({

      title: form.title.trim(),

      description: form.description.trim(),

      category: fixedCategory ?? form.category,

      name: form.name.trim(),

      address: form.address.trim(),

      phone: form.phone.trim(),

      price: form.price.trim(),

      images: form.images,

    });

  };



  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {

    const files = e.target.files ? Array.from(e.target.files) : [];

    if (!files.length) return;

    const readers = files.slice(0, 5).map(f => new Promise<string>((res) => {

      const r = new FileReader();

      r.onload = () => res(r.result as string);

      r.readAsDataURL(f);

    }));

    Promise.all(readers).then(arr => setForm(f => ({ ...f, images: [...f.images, ...arr].slice(0, 5) })));

  };



  if(!open) return null;

  return (

    <Modal onClose={onClose} title="Создать объявление" badge="НОВОЕ">

      <form onSubmit={submit} style={{ display:'grid', gap:12 }}>

        <div>

          <div style={S.label}>Категория</div>

          {fixedCategory ? (

            <div style={{...S.input, borderColor:'#2b2b2b', minHeight: '42px', display: 'flex', alignItems: 'center' }}> {labelById(fixedCategory)} </div>

          ) : (

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

              {CATEGORIES.map(c => (

                <button

                  key={c.id}

                  type="button"

                  onClick={()=>setForm(f=>({...f, category: c.id as CategoryId}))}

                  style={{

                    ...S.chip,

                    ...(form.category === c.id ? S.chipActive : {}),

                    textAlign: 'left',

                    padding: '10px 14px'

                  }}

                >

                  {c.label}

                </button>

              ))}

            </div>

          )}

        </div>



        <div>

          <div style={S.label}>Цена (необязательно)</div>

          <input value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} placeholder="Напр.: 5 000 ₽" style={{...S.input, minHeight: '42px', boxSizing: 'border-box' }} />

        </div>



        <div>

          <div style={S.label}>Заголовок</div>

          <input value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))} placeholder="Коротко опишите объявление" style={S.input} />

        </div>

        <div>

          <div style={S.label}>Описание</div>

          <textarea value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} placeholder="Подробности, состояние, условия и т.п." style={{...S.input, minHeight:100}} />

        </div>



        <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(3, 1fr)', alignItems:'start', maxWidth: '100%', boxSizing: 'border-box' }}>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Имя *" value={form.name} onChange={v=>setForm(f=>({...f, name:v}))} error={errors.name} placeholder="Как к вам обращаться" />

          </div>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Адрес *" value={form.address} onChange={v=>setForm(f=>({...f, address:v}))} error={errors.address} placeholder="Город, улица..." />

          </div>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Телефон *" value={form.phone} onChange={v=>setForm(f=>({...f, phone:v}))} error={errors.phone} placeholder="Напр.: +7 900 123-45-67" />

          </div>

        </div>



        <div>

          <div style={S.label}>Фото (до 5 файлов)</div>

          <input type="file" accept="image/*" multiple onChange={onPickFiles} />

          {form.images.length > 0 && (

            <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', marginTop:8 }}>

              {form.images.map((src, i)=>(

                <div key={i} style={{ position:'relative' }}>

                  <img src={src} alt={`img-${i}`} style={{ width:'100%', height:80, objectFit:'cover', border:'1px solid #2b2b2b', borderRadius:8 }} />

                </div>

              ))}

            </div>

          )}

        </div>



        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>

          <button type="button" onClick={onClose} style={S.btnGhost}>Отмена</button>

          <button type="submit" style={S.btnY}>Опубликовать</button>

        </div>

      </form>

    </Modal>

  );

}



function Field({ label, value, onChange, placeholder, error }: {

  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; error?:string;

}) {

  return (

    <div>

      <div style={S.label}>{label}</div>

      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...S.input, borderColor: error? '#f87171': '#2b2b2b'}} />

      {error && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>{error}</div>}

    </div>

  );

}



function ChatModal({ open, listing, messages, onClose, onSend, sellerOnline }: {

  open:boolean; listing: Listing | null; messages: ChatMessage[];

  onClose: ()=>void; onSend: (author:string, text:string, imageData?:string)=>void; sellerOnline:boolean;

}) {

  const [author, setAuthor] = useState("");

  const [text, setText] = useState("");

  const [imageData, setImageData] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState("");

  if(!open || !listing) return null;



  const submit = (e: React.FormEvent) => {

    e.preventDefault();

    if(!author.trim() || (!text.trim() && !imageData)) return;

    const chk = canSendMessage(listing.id, author.trim());

    if(!chk.allowed){ setErrorMsg('Вы отправляете слишком быстро. Попробуйте чуть позже.'); return; }

    onSend(author.trim(), text.trim() || (imageData? "": ""), imageData || undefined);

    const updated = [...chk.arr, Date.now()]; localStorage.setItem(chk.key, JSON.stringify(updated));

    setText(""); setImageData(""); setErrorMsg("");

  };



  return (

    <Modal onClose={onClose} title={listing.title?.trim() || 'Объявление'} badge="ЧАТ" extra={

      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:14 }}>

        <span style={{ display:'inline-block', width:10, height:10, borderRadius:999, background: sellerOnline? '#22c55e': '#666' }} />

        <span style={{ color:'#bbb' }}>{sellerOnline? 'Продавец онлайн': 'Продавец оффлайн'}</span>

      </div>

    }>

      <div style={{ maxHeight: '45vh', overflow:'auto', padding:12, background:'#0f0f0f', border:'1px solid #2b2b2b', borderRadius:12 }}>

        {messages.length===0 ? (

          <div style={{ color:'#bbb', fontSize:14 }}>Пока сообщений нет. Задайте ваш вопрос продавцу.</div>

        ) : messages.map(m => (

          <div key={m.id} style={{ marginBottom:8 }}>

            <div style={{ color:'#aaa', fontSize:12 }}>{m.author} • {new Date(m.timestamp).toLocaleString()}</div>

            <div style={{ background:'#0b0b0b', border:'1px solid #1f1f1f', borderRadius:10, padding:'8px 10px', marginTop:4 }}>

              {m.text}

              {m.imageData && <img src={m.imageData} alt="img" style={{ display:'block', maxHeight:220, borderRadius:8, marginTop:8 }} />}

            </div>

          </div>

        ))}

      </div>

      <form onSubmit={submit} style={{ display:'grid', gap:8, marginTop:12 }}>

        <input placeholder="Ваше имя" value={author} onChange={e=>setAuthor(e.target.value)} style={S.input} />

        <textarea placeholder="Сообщение продавцу..." value={text} onChange={e=>setText(e.target.value)} style={{...S.input, minHeight:80}} />

        <input type="file" accept="image/*" onChange={e=>{ const f = e.target.files?.[0]; if(!f) return; const r = new FileReader(); r.onload=()=>setImageData(r.result as string); r.readAsDataURL(f); }} />

        {imageData && <img src={imageData} alt="preview" style={{ maxHeight:160, border:'1px solid #2b2b2b', borderRadius:8 }} />}

        {errorMsg && <div style={{ color:'#f87171', fontSize:13 }}>{errorMsg}</div>}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>

          <button type="button" onClick={onClose} style={S.btnGhost}>Закрыть</button>

          <button type="submit" style={S.btnY}>Отправить</button>

        </div>

      </form>

    </Modal>

  );

}



function EditListingModal({ open, listing, onClose, onSubmit }: {

  open:boolean; listing: Listing | null; onClose: ()=>void; onSubmit: (updated: Listing)=>void;

}) {

  const [form, setForm] = useState({ title: "", description: "", category: CATEGORIES[0].id as CategoryId, name: "", address: "", phone: "", price: "", images: [] as string[] });

  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(()=>{ if(open && listing){ setForm({ title: listing.title||"", description: listing.description||"", category: listing.category, name: listing.name, address: listing.address, phone: listing.phone, price: listing.price||"", images: listing.images||[] }); setErrors({}); } }, [open, listing]);

  if(!open || !listing) return null;

  const validate = () => { const e: Record<string,string> = {}; if(!form.name.trim()) e.name='Укажите имя'; if(!form.address.trim()) e.address='Укажите адрес'; if(!form.phone.trim()) e.phone='Укажите телефон'; if(form.phone && !phoneValid(form.phone)) e.phone='Некорректный номер'; setErrors(e); return Object.keys(e).length===0; };

  const submit = (ev: React.FormEvent) => { ev.preventDefault(); if(!validate()) return; onSubmit({ ...listing, ...{ title: form.title.trim(), description: form.description.trim(), category: form.category, name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim(), price: form.price.trim(), images: form.images } }); };



  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {

    const files = e.target.files ? Array.from(e.target.files) : [];

    if (!files.length) return;

    const readers = files.slice(0, 5).map(f => new Promise<string>((res) => {

      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f);

    }));

    Promise.all(readers).then(arr => setForm(f => ({ ...f, images: [...f.images, ...arr].slice(0, 5) })));

  };



  return (

    <Modal onClose={onClose} title="Редактировать объявление" badge="РЕДАКТИРОВАНИЕ">

      <form onSubmit={submit} style={{ display:'grid', gap:12 }}>

        <div>

          <div style={S.label}>Категория</div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

            {CATEGORIES.map(c => (

              <button

                key={c.id}

                type="button"

                onClick={()=>setForm(f=>({...f, category: c.id as CategoryId}))}

                style={{

                  ...S.chip,

                  ...(form.category === c.id ? S.chipActive : {}),

                  textAlign: 'left',

                  padding: '10px 14px'

                }}

              >

                {c.label}

              </button>

            ))}

          </div>

        </div>



        <div>

          <div style={S.label}>Цена (необязательно)</div>

          <input value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} placeholder="Напр.: 5 000 ₽" style={{...S.input, minHeight: '42px', boxSizing: 'border-box' }} />

        </div>

        <div>

          <div style={S.label}>Заголовок</div>

          <input value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))} placeholder="Коротко опишите объявление" style={S.input} />

        </div>

        <div>

          <div style={S.label}>Описание</div>

          <textarea value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} placeholder="Подробности, состояние, условия и т.п." style={{...S.input, minHeight:100}} />

        </div>

        <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(3, 1fr)', alignItems:'start', maxWidth: '100%', boxSizing: 'border-box' }}>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Имя *" value={form.name} onChange={v=>setForm(f=>({...f, name:v}))} error={errors.name} placeholder="Как к вам обращаться" />

          </div>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Адрес *" value={form.address} onChange={v=>setForm(f=>({...f, address:v}))} error={errors.address} placeholder="Город, улица..." />

          </div>

          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

            <Field label="Телефон *" value={form.phone} onChange={v=>setForm(f=>({...f, phone:v}))} error={errors.phone} placeholder="Напр.: +7 900 123-45-67" />

          </div>

        </div>



        <div>

          <div style={S.label}>Фото (до 5 файлов)</div>

          <input type="file" accept="image/*" multiple onChange={onPickFiles} />

          {form.images.length > 0 && (

            <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', marginTop:8 }}>

              {form.images.map((src, i)=>(

                <img key={i} src={src} alt={`img-${i}`} style={{ width:'100%', height:80, objectFit:'cover', border:'1px solid #2b2b2b', borderRadius:8 }} />

              ))}

            </div>

          )}

        </div>



        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>

          <button type="button" onClick={onClose} style={S.btnGhost}>Отмена</button>

          <button type="submit" style={S.btnY}>Сохранить</button>

        </div>

      </form>

    </Modal>

  );

}



function Modal({ children, onClose, title, badge, extra }: { children: React.ReactNode; onClose: ()=>void; title:string; badge?:string; extra?:React.ReactNode }) {

  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>

      <div onClick={onClose} style={{ position:'absolute', inset:0 }} />

      <div style={{ position:'relative', width:'min(100% - 24px, 720px)', background:'#0b0b0b', border:'1px solid rgba(250,204,21,.4)', borderRadius:16, padding:16 }}>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>

          {badge && <span style={{...S.pill, padding:'2px 8px'}}>{badge}</span>}

          <div style={{ fontWeight:900, fontSize:18 }}>{title}</div>

          <div style={{ marginLeft:'auto' }}>{extra}</div>

          <button onClick={onClose} style={{ ...S.btnGhost, padding:'6px 10px', marginLeft:8 }}>Закрыть</button>

        </div>

        {children}

      </div>

    </div>

  );

}

