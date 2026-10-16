import { ChevronDown, MessageCircle, PanelRightClose, PanelRightOpen, Send, UserPlus, X } from 'lucide-react';
import CommunityCourt from '../../components/CommunityCourt';
import { useApp } from '../../context/AppContext';

export default function CommunityOverlay() {
  const {
    communityAvatar, communityAvatars, communityChatDraft, communityChatListRef,
    communityChatOpen, communityGenderStyle, communityOwnerId, communityPanelOpen,
    communityShellRef, communityView, displayedCommunityMessages, handleAddCommunityAvatar,
    handleCommunityAvatarSelect, handleDeleteCommunityAvatar, handleSendCommunityMessage,
    isCommunityFullscreen, isProcessing, ownCommunityAvatar, selectedCommunityAvatar,
    setCommunityAvatar, setCommunityChatDraft, setCommunityChatOpen, setCommunityOpen,
    setCommunityPanelOpen, setCommunityView, setSelectedCommunityAvatar,
    toggleCommunityFullscreen,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm">
      <div ref={communityShellRef} className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-slate-100 shadow-2xl">
        <style>{`:fullscreen .community-grid { display: block !important; padding: 0 !important; } :fullscreen .community-panel { display: none !important; } div.absolute.bottom-4[class~="left-1/2"] { display: none !important; }`}</style>
        <button type="button" onClick={toggleCommunityFullscreen} className={`${isCommunityFullscreen ? 'fixed right-5 top-5 z-[140] block' : 'hidden'} rounded-xl bg-slate-950/85 px-4 py-2.5 text-xs font-black text-white shadow-xl backdrop-blur-sm hover:bg-slate-950`}>ออกจากเต็มจอ</button>
        <div className={`${isCommunityFullscreen ? 'hidden' : 'flex'} items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white md:px-7 md:py-4`}>
          <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">BADBEAOW COMMUNITY</div><h2 className="mt-1 truncate text-base font-black md:text-lg">สนามคอมมูของผู้เล่น</h2><p className="hidden text-[11px] text-white/60 sm:block">ผู้เล่นที่เพิ่มตัวละครจะปรากฏในพื้นที่นี้ให้ทุกคนเห็น</p></div>
          <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => setCommunityPanelOpen(open => !open)} className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-400 md:hidden"><UserPlus size={15} /> ตัวละคร</button><button type="button" onClick={toggleCommunityFullscreen} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">{isCommunityFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}</button><button type="button" onClick={() => setCommunityOpen(false)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"><X size={17} /></button></div>
        </div>
        <div className={`community-grid flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-0 md:grid md:p-3 ${communityPanelOpen && !isCommunityFullscreen ? 'md:grid-cols-[1fr_340px]' : ''} ${isCommunityFullscreen ? 'block' : ''}`}>
          <div className={`relative overflow-hidden bg-[#dff4f0] shadow-inner ${isCommunityFullscreen ? 'h-screen min-h-0 rounded-none' : 'min-h-0 flex-1 md:min-h-[calc(100vh-120px)] md:rounded-3xl'}`}>
            <CommunityCourt avatars={communityAvatars} view={communityView} ownerId={communityOwnerId} onAvatarSelect={handleCommunityAvatarSelect} />
            <div className={`${isCommunityFullscreen ? 'hidden' : 'pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-2xl bg-slate-950/75 px-3 py-2 text-white md:left-4 md:top-4 md:px-3.5 md:py-2.5'}`}><div className="text-sm font-black">ศูนย์กีฬาคอมมู 3D</div><div className="mt-1 text-[11px] text-white/75 md:text-xs">ออนไลน์ {communityAvatars.length} ตัวละคร · แตะตัวละครเพื่อดูรายละเอียด</div></div>
            <div className={`${isCommunityFullscreen ? 'hidden' : 'absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-2xl bg-slate-950/80 p-1.5 backdrop-blur-sm'}`}>{[['overview', 'ภาพรวม'], ['badminton', 'สนามแบด'], ['futsal', 'ฟุตซอล'], ['basketball', 'บาส'], ['rest', 'โซนพัก']].map(([key, label]) => <button key={key} type="button" onClick={() => setCommunityView(key)} className={`rounded-xl px-3 py-2 text-[10px] font-bold ${communityView === key ? 'bg-emerald-400 text-slate-950' : 'text-white/75 hover:bg-white/10'}`}>{label}</button>)}</div>
            {!communityPanelOpen && !isCommunityFullscreen && (
              <button type="button" onClick={() => setCommunityPanelOpen(true)} className="absolute right-4 top-4 z-20 hidden items-center gap-2 rounded-2xl bg-white/95 md:flex px-3.5 py-2.5 text-xs font-black text-indigo-700 shadow-lg hover:bg-white"><PanelRightOpen size={16} /> สร้างตัวละคร / ผู้เล่น</button>
            )}
            {selectedCommunityAvatar && (() => {
              const selected = communityAvatars.find(avatar => avatar.id === selectedCommunityAvatar.id) || selectedCommunityAvatar;
              const badge = communityGenderStyle(selected.gender);
              const modelName = selected.model ? selected.model.split('/').pop().replace(/\.glb$/i, '').replace(/[-_]+/g, ' ') : 'ตัวละครพื้นฐาน';
              return (
                <div className="absolute left-1/2 top-20 z-30 w-[min(calc(100%-2rem),380px)] -translate-x-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                  <div className="flex items-start gap-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-emerald-900 p-4 text-white">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black shadow-inner" style={{ background: selected.shirt || '#3c83ee' }}>{(selected.name || '?').slice(0, 1)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><h3 className="truncate text-lg font-black">{selected.name}</h3><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-[0_0_12px_rgba(255,255,255,0.55)] ring-2 ring-white ${badge.className}`}>{badge.symbol}</span></div>
                      <div className="mt-0.5 text-xs text-white/70">{selected.gender || 'ไม่ระบุเพศ'}{selected.ownerId === communityOwnerId ? ' · ตัวละครของคุณ' : ''}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedCommunityAvatar(null)} aria-label="ปิดรายละเอียด" className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X size={16} /></button>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-base leading-7 text-slate-700">{selected.description || 'ยังไม่มีคำอธิบาย'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-2xl bg-slate-50 p-2.5"><div className="text-slate-400">ชุด</div><div className="mt-0.5 font-bold text-slate-800">{selected.outfit || 'เสื้อยืด + กางเกงขาสั้น'}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-2.5"><div className="text-slate-400">โมเดล</div><div className="mt-0.5 truncate font-bold capitalize text-slate-800">{modelName}</div></div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">{[['shirt', 'เสื้อ'], ['pants', 'กางเกง'], ['hair', 'ผม'], ['skin', 'ผิว']].filter(([key]) => selected[key]).map(([key, label]) => <span key={key} className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: selected[key] }} />{label}</span>)}</div>
                  </div>
                </div>
              );
            })()}
            <div className="absolute bottom-3 right-3 z-20 w-[min(calc(100%-9.5rem),340px)] min-w-[190px] md:bottom-5 md:right-5 md:w-[min(calc(100%-11.5rem),340px)]">
              {communityChatOpen ? (
                <div className="flex max-h-[38vh] flex-col md:max-h-[45vh] overflow-hidden rounded-2xl bg-slate-950/80 text-white shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><span className="flex items-center gap-2 text-sm font-black"><MessageCircle size={16} className="text-emerald-300" /> แชทโลก</span><button type="button" onClick={() => setCommunityChatOpen(false)} aria-label="ย่อแชท" className="rounded-lg p-1 text-white/70 hover:bg-white/10"><ChevronDown size={16} /></button></div>
                  <div ref={communityChatListRef} className="min-h-[90px] flex-1 space-y-1.5 overflow-y-auto px-3 py-2 text-sm leading-6">
                    {displayedCommunityMessages.length ? displayedCommunityMessages.map(message => <div key={message.id} className="break-words"><span className={`font-bold ${message.senderId === communityOwnerId ? 'text-emerald-300' : 'text-sky-300'}`}>{message.sender}</span><span className="text-white/90">: {message.text}</span>{message.localOnly && <span className="ml-1 text-[10px] text-amber-300">(ยังไม่ถึงเซิร์ฟเวอร์)</span>}</div>) : <div className="py-3 text-center text-xs text-white/50">ยังไม่มีข้อความ ทักทายเพื่อน ๆ ได้เลย</div>}
                  </div>
                  <form onSubmit={handleSendCommunityMessage} className="flex gap-2 border-t border-white/10 p-2"><input value={communityChatDraft} maxLength={180} onChange={event => setCommunityChatDraft(event.target.value)} placeholder={ownCommunityAvatar ? `พิมพ์ในนาม ${ownCommunityAvatar.name}` : 'พิมพ์ข้อความ...'} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15" /><button type="submit" disabled={!communityChatDraft.trim()} aria-label="ส่งข้อความ" className="rounded-xl bg-emerald-400 px-3 text-slate-950 hover:bg-emerald-300 disabled:opacity-40"><Send size={16} /></button></form>
                </div>
              ) : (
                <button type="button" onClick={() => setCommunityChatOpen(true)} className="ml-auto flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2.5 text-sm font-black text-white shadow-xl backdrop-blur-md hover:bg-slate-950"><MessageCircle size={16} className="text-emerald-300" /> แชทโลก{displayedCommunityMessages.length > 0 && <span className="rounded-full bg-emerald-400 px-2 text-xs text-slate-950">{displayedCommunityMessages.length}</span>}</button>
              )}
            </div>
          </div>
          {communityPanelOpen && !isCommunityFullscreen && <button type="button" aria-label="ปิดแผงตัวละคร" onClick={() => setCommunityPanelOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" />}
          {communityPanelOpen && (
            <div className="community-panel fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] min-h-0 overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl md:static md:z-auto md:max-h-none md:rounded-3xl md:pb-4 md:shadow-sm">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 md:hidden" />
              <div className="flex items-center justify-between"><h3 className="text-base font-black text-slate-900">สร้างตัวละคร</h3><button type="button" onClick={() => setCommunityPanelOpen(false)} className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"><PanelRightClose size={15} /> พับเก็บ</button></div>
              {ownCommunityAvatar ? <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><div className="text-sm font-bold text-emerald-800">เครื่องนี้มี Avatar แล้ว</div><div className="mt-1 text-xs text-emerald-700">{ownCommunityAvatar.name} · {ownCommunityAvatar.gender}</div><button type="button" onClick={handleDeleteCommunityAvatar} disabled={isProcessing} className="mt-3 w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isProcessing ? 'กำลังลบ...' : 'ลบ Avatar ของฉัน'}</button></div> : <><div className="mt-3 space-y-2"><input value={communityAvatar.name} maxLength={22} onChange={event => setCommunityAvatar(current => ({ ...current, name: event.target.value }))} placeholder="ชื่อที่แสดง" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" /><input value={communityAvatar.description} maxLength={36} onChange={event => setCommunityAvatar(current => ({ ...current, description: event.target.value }))} placeholder="คำอธิบายสั้น ๆ" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" /><select value={communityAvatar.gender} onChange={event => setCommunityAvatar(current => ({ ...current, gender: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"><option>ชาย</option><option>หญิง</option><option>เพศทางเลือก</option></select></div><button type="button" onClick={handleAddCommunityAvatar} className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">เพิ่มตัวละครเข้าคอมมู</button></>}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="text-base font-black text-slate-900">ผู้เล่นในคอมมู ({communityAvatars.length})</h3>
                <div className="mt-3 space-y-2">{communityAvatars.length ? communityAvatars.map(avatar => { const badge = communityGenderStyle(avatar.gender); return <button type="button" key={avatar.id} onClick={() => setSelectedCommunityAvatar(avatar)} className={`block w-full rounded-2xl p-3 text-left transition hover:bg-indigo-50 ${selectedCommunityAvatar?.id === avatar.id ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'}`}><div className="flex items-center gap-2"><span className="truncate text-sm font-bold text-slate-900">{avatar.name}</span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ring-2 ring-white ${badge.className}`}>{badge.symbol}</span>{avatar.ownerId === communityOwnerId && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">คุณ</span>}</div><div className="mt-1 text-sm leading-6 text-gray-600">{avatar.description}</div></button>; }) : <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">ยังไม่มีตัวละคร</div>}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
