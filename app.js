/* Muslimer Pathshala Activity Diary — closed pilot v0.2. */
(() => {
  'use strict';

  const CONFIG = window.PILOT_CONFIG || {};
  const TODAY = localDate(new Date());
  const LEVELS = Object.freeze({
    tamhidi: 'তামহিদী ২',
    ibtidai: 'ইবতিদায়ী ১',
    pathshala: 'পাঠশালা (খ ও গ)'
  });
  const YES_NO = [{v:'yes',t:'হ্যাঁ'},{v:'no',t:'না'}];
  const REMINDERS = [{v:'0',t:'০ বার'},{v:'1',t:'১ বার'},{v:'2+',t:'২ বা বেশি'}];
  const SALAT = [{v:'on',t:'ওয়াক্তমতো'},{v:'late',t:'পরে'},{v:'no',t:'আজ হয়নি'},{v:'na',t:'প্রযোজ্য নয়'}];
  const ACTIVITIES = Object.freeze({
    tamhidi: [
      {id:'bismillah',q:'খাবারের আগে বিসমিল্লাহ বলেছি?',options:YES_NO},
      {id:'quran',q:'আজ কুরআন শুনেছি বা তিলাওয়াত করেছি?',options:YES_NO},
      {id:'respect',q:'বাবা-মায়ের কথা মনোযোগ দিয়ে শুনেছি?',options:[{v:'yes',t:'হ্যাঁ'},{v:'reminder',t:'মনে করাতে হয়েছে'}]}
    ],
    ibtidai: [
      {id:'fajr',q:'আজ ফজরের সালাত অনুশীলন করেছি?',options:[{v:'yes',t:'হ্যাঁ'},{v:'no',t:'আজ হয়নি'},{v:'na',t:'প্রযোজ্য নয়'}]},
      {id:'quran',q:'আজ কুরআন পড়েছি বা শুনেছি?',options:YES_NO},
      {id:'remind',q:'কথা শোনার জন্য কতবার মনে করাতে হয়েছে?',options:REMINDERS},
      {id:'help',q:'আজ কাউকে সাহায্য করেছি?',options:YES_NO}
    ],
    pathshala: [
      {id:'fajr',q:'আজ ফজরের সালাত ওয়াক্তমতো আদায় করেছি?',options:SALAT},
      {id:'quran',q:'আজ কুরআন তিলাওয়াত বা পুনরাবৃত্তি করেছি?',options:YES_NO},
      {id:'remind',q:'বাবা-মায়ের কথা শোনার জন্য কতবার মনে করাতে হয়েছে?',options:REMINDERS},
      {id:'good',q:'আজ সচেতনভাবে একটি ভালো কাজ করেছি?',options:YES_NO}
    ]
  });
  const FAMILY_ACTIVITIES = [
    {id:'time',q:'সন্তানের সঙ্গে মনোযোগ দিয়ে সময় কাটিয়েছি?',options:YES_NO},
    {id:'anger',q:'আজ সন্তানের সঙ্গে অপ্রয়োজনীয় রাগ করেছি?',options:REMINDERS},
    {id:'talk',q:'সন্তানের সঙ্গে দ্বীন বা জীবনবোধ নিয়ে কথা বলেছি?',options:YES_NO},
    {id:'praise',q:'সন্তানের ভালো কাজকে উৎসাহ দিয়েছি?',options:YES_NO}
  ];
  const DAYS = ['রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি','শুক্র','শনি'];
  const BN_NUMS = '০১২৩৪৫৬৭৮৯';
  const iconPaths = {
    pencil:'<path d="m13 4 7 7M4 20l4.7-1.1L20 7.6 16.4 4 5.1 15.3 4 20Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h3"/>',
    home:'<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/>',
    chart:'<path d="M4 20V4M4 20h17M8 16v-4M13 16V7M18 16V4"/>',
    check:'<path d="m4 12 5 5 11-11"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/>',
    shield:'<path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>'
  };

  const state = {
    session:null, profile:null, families:[], learners:[], learnerEntries:[],
    familyEntries:[], sharedNotes:[], consents:[], date:TODAY,
    active:'daily', lastRole:null, selectedLearner:null, dailyTarget:null, busy:false,
    noteDraft:'', shareDraft:false, notice:'', error:''
  };
  let backend;
  let toastTimer;

  function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function offsetDay(date,delta){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+delta);return localDate(d);}
  function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function bn(x){return String(x).replace(/\d/g,c=>BN_NUMS[Number(c)]);}
  function dateName(key){return new Intl.DateTimeFormat('bn-BD',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${key}T12:00:00`));}
  function dayShort(key){return DAYS[new Date(`${key}T12:00:00`).getDay()];}
  function ico(name,size=18){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.home}</svg>`;}
  function weekDays(){return Array.from({length:7},(_,i)=>offsetDay(state.date,i-6));}
  function entryKey(entity,date){return `${entity}|${date}`;}
  function learnerEntry(id,date=state.date){return state.learnerEntries.find(x=>x.learner_id===id&&x.entry_date===date)||{answers:{}};}
  function familyEntry(id,date=state.date){return state.familyEntries.find(x=>x.family_id===id&&x.entry_date===date)||{answers:{},note:'',share_with_teacher:false};}
  function questionsFor(learner){return ACTIVITIES[learner?.level]||[];}
  function countAnswers(answers,questions){return questions.filter(q=>Object.hasOwn(answers||{},q.id)&&answers[q.id]!=='').length;}
  function answerText(question,value){if(value===undefined||value===null||value==='')return 'উত্তর নেই';return question.options.find(x=>x.v===value)?.t||'উত্তর নেই';}
  function isParent(){return state.profile?.role==='parent';}
  function ownFamily(){return state.families[0]||null;}
  function captureNoteDraft(){const note=document.getElementById('family-note');if(note){state.noteDraft=note.value.slice(0,1200);state.shareDraft=Boolean(document.getElementById('share-note')?.checked);}}
  function showToast(message){const n=document.getElementById('toast');if(!n)return;n.textContent=message;n.classList.remove('hide');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.add('hide'),2400);}

  class DemoBackend {
    constructor(){
      this.key='mp-pilot-qa-v02';
      this.role=sessionStorage.getItem('mp-pilot-qa-role')||'';
      try{this.db=JSON.parse(localStorage.getItem(this.key))||this.seed();}catch(_){this.db=this.seed();}
    }
    seed(){
      const yesterday=offsetDay(TODAY,-1);
      return {
        families:[{id:'family-1',alias:'রহমান পরিবার'}],
        learners:[
          {id:'learner-1',family_id:'family-1',alias:'আহমাদ',level:'tamhidi',active:true},
          {id:'learner-2',family_id:'family-1',alias:'মারইয়াম',level:'ibtidai',active:true},
          {id:'learner-3',family_id:'family-1',alias:'ইয়াসিন',level:'pathshala',active:true}
        ],
        learnerEntries:[{learner_id:'learner-1',entry_date:yesterday,answers:{bismillah:'yes',quran:'yes',respect:'reminder'}}],
        familyEntries:[], sharedNotes:[], consents:[]
      };
    }
    persist(){localStorage.setItem(this.key,JSON.stringify(this.db));}
    async getSession(){return this.role?{user:{id:`demo-${this.role}`,email:`${this.role}@pilot.invalid`}}:null;}
    async chooseRole(role){this.role=role;sessionStorage.setItem('mp-pilot-qa-role',role);}
    async sendMagicLink(){throw new Error('Preview mode does not send email.');}
    async logout(){this.role='';sessionStorage.removeItem('mp-pilot-qa-role');}
    async load(){
      const profile={id:`demo-${this.role}`,display_name:this.role==='teacher'?'পাইলট শিক্ষক':'পাইলট অভিভাবক',role:this.role,active:true};
      return {...structuredClone(this.db),profile};
    }
    async saveLearner(learnerId,date,answers){
      const row={learner_id:learnerId,entry_date:date,answers:{...answers}};
      const i=this.db.learnerEntries.findIndex(x=>entryKey(x.learner_id,x.entry_date)===entryKey(learnerId,date));
      if(i<0)this.db.learnerEntries.push(row);else this.db.learnerEntries[i]=row;this.persist();return row;
    }
    async saveFamily(familyId,date,answers,note,share){
      const row={family_id:familyId,entry_date:date,answers:{...answers},note};
      const i=this.db.familyEntries.findIndex(x=>entryKey(x.family_id,x.entry_date)===entryKey(familyId,date));
      if(i<0)this.db.familyEntries.push(row);else this.db.familyEntries[i]=row;
      const n=this.db.sharedNotes.findIndex(x=>entryKey(x.family_id,x.entry_date)===entryKey(familyId,date));
      if(share&&note){const shared={family_id:familyId,entry_date:date,note};if(n<0)this.db.sharedNotes.push(shared);else this.db.sharedNotes[n]=shared;}else if(n>=0)this.db.sharedNotes.splice(n,1);
      this.persist();return row;
    }
    async acceptConsent(familyIds,version,userId){
      familyIds.forEach(familyId=>{const row={family_id:familyId,guardian_user_id:userId,version,accepted_at:new Date().toISOString()};const i=this.db.consents.findIndex(x=>x.family_id===familyId);if(i<0)this.db.consents.push(row);else this.db.consents[i]=row;});this.persist();
    }
  }

  class SupabaseBackend {
    constructor(client){this.client=client;}
    async getSession(){const {data,error}=await this.client.auth.getSession();if(error)throw error;return data.session;}
    async sendMagicLink(email){
      const redirect=`${location.origin}${location.pathname}`;
      const {error}=await this.client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirect}});if(error)throw error;
    }
    async logout(){const {error}=await this.client.auth.signOut();if(error)throw error;}
    async query(promise){const {data,error}=await promise;if(error)throw error;return data||[];}
    async load(date,userId){
      const profile=await this.query(this.client.from('profiles').select('id,display_name,role,active').eq('id',userId).single());
      if(!profile.active)throw new Error('এই পাইলট অ্যাকাউন্টটি নিষ্ক্রিয়।');
      const start=offsetDay(date,-6);
      let families=[],learners=[],familyEntries=[],sharedNotes=[],consents=[];
      if(profile.role==='parent'){
        const memberships=await this.query(this.client.from('family_members').select('family_id').eq('user_id',userId));
        const familyIds=memberships.map(x=>x.family_id);
        if(familyIds.length){
          [families,learners,familyEntries,sharedNotes,consents]=await Promise.all([
            this.query(this.client.from('families').select('id,alias').in('id',familyIds)),
            this.query(this.client.from('learners').select('id,family_id,alias,level,active').in('family_id',familyIds).eq('active',true).order('alias')),
            this.query(this.client.from('family_entries').select('family_id,entry_date,answers,note,updated_at').in('family_id',familyIds).gte('entry_date',start).lte('entry_date',date)),
            this.query(this.client.from('shared_family_notes').select('family_id,entry_date,note,updated_at').in('family_id',familyIds).gte('entry_date',start).lte('entry_date',date)),
            this.query(this.client.from('consents').select('family_id,guardian_user_id,version,accepted_at').in('family_id',familyIds))
          ]);
        }
      } else if(profile.role==='teacher'){
        const assignments=await this.query(this.client.from('teacher_assignments').select('learner_id').eq('teacher_id',userId));
        const learnerIds=assignments.map(x=>x.learner_id);
        if(learnerIds.length){
          learners=await this.query(this.client.from('learners').select('id,family_id,alias,level,active').in('id',learnerIds).eq('active',true).order('alias'));
          const familyIds=[...new Set(learners.map(x=>x.family_id))];
          [families,sharedNotes]=await Promise.all([
            this.query(this.client.from('families').select('id,alias').in('id',familyIds)),
            this.query(this.client.from('shared_family_notes').select('family_id,entry_date,note,updated_at').in('family_id',familyIds).gte('entry_date',start).lte('entry_date',date))
          ]);
        }
      } else throw new Error('এই অ্যাকাউন্টে অনুমোদিত ভূমিকা নেই।');
      const learnerIds=learners.map(x=>x.id);
      const learnerEntries=learnerIds.length?await this.query(this.client.from('learner_entries').select('learner_id,entry_date,answers,updated_at').in('learner_id',learnerIds).gte('entry_date',start).lte('entry_date',date)):[];
      return {profile,families,learners,learnerEntries,familyEntries,sharedNotes,consents};
    }
    async saveLearner(learnerId,date,answers,userId){
      return this.query(this.client.from('learner_entries').upsert({learner_id:learnerId,entry_date:date,answers,created_by:userId},{onConflict:'learner_id,entry_date'}).select('learner_id,entry_date,answers,updated_at').single());
    }
    async saveFamily(familyId,date,answers,note,share,userId){
      const row=await this.query(this.client.from('family_entries').upsert({family_id:familyId,entry_date:date,answers,note,created_by:userId},{onConflict:'family_id,entry_date'}).select('family_id,entry_date,answers,note,updated_at').single());
      if(share&&note){await this.query(this.client.from('shared_family_notes').upsert({family_id:familyId,entry_date:date,note,created_by:userId},{onConflict:'family_id,entry_date'}).select('family_id'));}
      else {const {error}=await this.client.from('shared_family_notes').delete().eq('family_id',familyId).eq('entry_date',date);if(error)throw error;}
      return row;
    }
    async acceptConsent(familyIds,version,userId){
      const rows=familyIds.map(family_id=>({family_id,guardian_user_id:userId,version}));
      await this.query(this.client.from('consents').upsert(rows,{onConflict:'family_id'}).select('family_id'));
    }
  }

  function renderSetup(){
    document.getElementById('app').innerHTML=`<main class="auth-page"><section class="auth-card"><div class="auth-brand"><img src="assets/pathshala-logo.png" alt="মুসলিমের পাঠশালা লোগো"><div><strong>মুসলিমের পাঠশালা</strong><small>Closed pilot · setup required</small></div></div><h1>পাইলটটি এখন নিরাপদভাবে বন্ধ আছে</h1><p>Supabase সংযোগ না হওয়া পর্যন্ত এই প্রকাশিত কপি কোনো শিশুর তথ্য গ্রহণ বা সংরক্ষণ করবে না।</p><div class="status-panel"><b>পরবর্তী কাজ:</b> Supabase project তৈরি করুন, <code>supabase/schema.sql</code> চালান, তারপর <code>config.example.js</code>-এর মান দিয়ে <code>config.js</code> আপডেট করুন।</div><code class="setup-code">mode: 'supabase'\nsupabaseUrl: 'https://…supabase.co'\nsupabaseAnonKey: 'publishable key'</code><p class="auth-help">গোপন <b>service_role</b> key কখনো GitHub বা এই ফাইলে রাখবেন না।</p></section></main>`;
  }

  function renderLogin(){
    const demo=CONFIG.mode==='demo';
    const unprovisioned=Boolean(state.session&&!state.profile);
    document.getElementById('app').innerHTML=`<main class="auth-page"><section class="auth-card"><div class="auth-brand"><img src="assets/pathshala-logo.png" alt="মুসলিমের পাঠশালা লোগো"><div><strong>মুসলিমের পাঠশালা</strong><small>Family Activity Diary</small></div></div><span class="role-chip">সীমিত পাইলট · ৩ স্তর · প্রতি স্তরে সর্বোচ্চ ৫ জন</span><h1 style="margin-top:14px">${unprovisioned?'Account setup অসম্পূর্ণ':'ডায়েরিতে প্রবেশ করুন'}</h1><p>${unprovisioned?'আপনার sign-in কাজ করেছে, কিন্তু pilot profile/family assignment এখনো সম্পূর্ণ হয়নি। পরিচালকের সঙ্গে যোগাযোগ করুন।':demo?'এটি শুধু QA preview; এখানে কোনো বাস্তব তথ্য ব্যবহার করবেন না।':'আপনার অনুমোদিত ইমেইলে একবার ব্যবহারযোগ্য নিরাপদ লিংক পাঠানো হবে।'}</p>${state.error?`<div class="status-panel error">${esc(state.error)}</div>`:''}${state.notice?`<div class="status-panel">${esc(state.notice)}</div>`:''}${unprovisioned?`<button class="ghost full" data-action="logout">Sign out</button>`:demo?`<div class="demo-actions"><button class="btn" data-demo-role="parent">অভিভাবক preview</button><button class="btn secondary" data-demo-role="teacher">শিক্ষক preview</button></div>`:`<form id="login-form"><label class="input-label" for="login-email">অনুমোদিত ইমেইল</label><input class="input" id="login-email" name="email" type="email" autocomplete="email" required placeholder="name@example.com"><button class="btn full" type="submit" ${state.busy?'disabled':''}>${state.busy?'পাঠানো হচ্ছে…':'Sign-in link পাঠান'}</button></form>`}<p class="auth-help">পরিবার প্রথমে পাইলট পরিচালককে নিজের ইমেইল দেবেন। আমন্ত্রণ পাওয়ার পর একই ইমেইল এখানে নিজে লিখে Sign-in link নেবেন; নতুন account এখানে নিজে থেকে তৈরি হয় না।</p></section></main>`;
  }

  function consentComplete(){return state.families.length>0&&state.families.every(f=>state.consents.some(c=>c.family_id===f.id&&c.version===CONFIG.consentVersion));}
  function renderConsent(){
    document.getElementById('app').innerHTML=`${brandMobile()}<div class="app-shell"><aside class="sidebar"><div class="logo-wrap">${brandDesktop()}</div><div class="sidebar-foot"><span class="side-dot"></span>Closed pilot · তথ্য ৯০ দিন রাখা হয়</div></aside><main class="main"><div class="topbar"><small>অভিভাবকের সম্মতি</small>${userBlock()}</div><section class="consent-wrap card"><div class="tinycaps">PARENT INFORMATION · VERSION ${esc(CONFIG.consentVersion)}</div><h1 style="font-size:25px;margin:6px 0 9px">পাইলট ব্যবহারের সম্মতি</h1><p class="sm muted">এই ডায়েরি ইসলামি অনুশীলনে পরিবার ও শিশুর নিয়মিত আত্মপর্যালোচনার জন্য। এটি পরীক্ষা, নম্বর, চিকিৎসা বা শিশুর যোগ্যতার মূল্যায়ন নয়।</p><ul class="consent-list"><li>শিশুর পূর্ণ নাম নয়—শুধু ডাকনাম/alias ব্যবহার করা হবে।</li><li>অভিভাবক নিজের পরিবারের উত্তর দেখবেন; নির্ধারিত শিক্ষক শিশুর জমা দেওয়া উত্তর পড়তে পারবেন।</li><li>অভিভাবকের নোট কেবল “শিক্ষকের সঙ্গে শেয়ার” বেছে নিলে শিক্ষক দেখবেন।</li><li>ডায়েরি এন্ট্রি ${bn(CONFIG.retentionDays||90)} দিন পরে মুছে ফেলার নিয়ম রাখা হয়েছে।</li><li>যেকোনো সময় পাইলট থেকে সরে যাওয়া বা তথ্য মুছে দিতে অনুরোধ করা যাবে।</li></ul><label class="consent-check"><input id="consent-box" type="checkbox"><span><b>আমি তথ্যটি পড়েছি এবং এই ছোট পাইলটে পরিবারের অংশগ্রহণে সম্মত।</b><br><span class="xs muted">শিশুর সঙ্গে বয়স-উপযোগীভাবে আলোচনা করাও পরিবারের দায়িত্ব।</span></span></label><button class="btn full" data-action="accept-consent" disabled>সম্মতি দিয়ে শুরু করুন</button><button class="ghost full" data-action="logout">Sign out</button></section></main></div><div id="toast" class="toast hide" aria-live="polite"></div>`;
  }

  function brandMobile(){return `<div class="mobile-brand"><div class="mini-logo"><img src="assets/pathshala-logo.png" alt="মুসলিমের পাঠশালা লোগো"></div><div><strong>মুসলিমের পাঠশালা</strong><small>Family Activity Diary</small></div></div>`;}
  function brandDesktop(){return `<div class="logo-surface"><img src="assets/pathshala-logo.png" alt="মুসলিমের পাঠশালা লোগো"></div><div><div class="brand-eyebrow">ACTIVITY DIARY</div><div class="brand-title">মুসলিমের পাঠশালা</div><div class="brand-sub">Closed family pilot</div></div>`;}
  function userBlock(){const initial=state.profile?.display_name?.trim()?.[0]||'•';return `<div class="top-user"><span class="sync-state ${state.busy?'busy':''}">${state.busy?'সংরক্ষণ হচ্ছে':'সুরক্ষিত সংযোগ'}</span><span class="avatar">${esc(initial)}</span><span class="identity"><strong class="sm">${esc(state.profile?.display_name||'পাইলট সদস্য')}</strong><br><span class="xs muted">${isParent()?'অভিভাবক':'শিক্ষক'}</span></span><button class="ghost" data-action="logout" title="Sign out">${ico('logout',15)} <span class="identity">Sign out</span></button></div>`;}
  function navItems(){return isParent()?[{id:'daily',t:'Daily Diary',i:'pencil'},{id:'week',t:'My Week',i:'calendar'},{id:'privacy',t:'Privacy & Data',i:'shield'}]:[{id:'overview',t:'Class Overview',i:'chart'},{id:'answers',t:'Student Answers',i:'users'},{id:'privacy',t:'Privacy & Data',i:'shield'}];}
  function shell(content){
    return `${brandMobile()}<div class="app-shell"><aside class="sidebar"><div class="logo-wrap">${brandDesktop()}</div><div class="side-label">ডায়েরি ও পর্যালোচনা</div><nav class="nav" aria-label="প্রধান নেভিগেশন">${navItems().map(n=>`<button class="nav-btn ${state.active===n.id?'active':''}" data-page="${n.id}" ${state.active===n.id?'aria-current="page"':''}>${ico(n.i)}<span>${esc(n.t)}</span></button>`).join('')}</nav><div class="sidebar-foot"><span class="side-dot"></span>Closed pilot · ৩ স্তর · ১৫ জনের সীমা<br>প্রকৃত উত্তর; কোনো ধর্মীয় স্কোর নয়।</div></aside><main class="main"><div class="topbar"><small>${dateName(state.date)} · ${CONFIG.mode==='demo'?'QA preview':'private pilot'}</small>${userBlock()}</div>${state.error?`<div class="status-panel error">${esc(state.error)}</div>`:''}${content}<p class="disclaimer">Muslimer Pathshala · Primary pilot v0.2 · আত্মপর্যালোচনার সহায়ক, পরীক্ষা বা ধর্মীয় মূল্যায়ন নয়। তথ্য ${bn(CONFIG.retentionDays||90)} দিন রাখার পরিকল্পনা করা হয়েছে।</p><div class="footer-links"><button data-page="privacy">Privacy & Data</button><button data-action="logout">Sign out</button></div></main></div><div id="toast" aria-live="polite" class="toast hide"></div>`;
  }
  function hero(title,description,tag){return `<section class="hero"><div class="eyebrow">MUSLIMER PATHSHALA · PRIMARY PILOT</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="hero-bottom"><span class="tag">${esc(tag)}</span><span class="tag gold">আত্মপর্যালোচনা · পরিবার · অগ্রগতি</span></div></section>`;}
  function dateControl(){return `<label class="date-field">তারিখ <input id="date-control" aria-label="ডায়েরির তারিখ" type="date" min="${offsetDay(TODAY,-89)}" max="${TODAY}" value="${state.date}"></label>`;}
  function progress(answers,questions){const n=countAnswers(answers,questions),pct=questions.length?Math.round(n/questions.length*100):0;return `<div class="progress-wrap"><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${n}"><div class="progress-fill" style="width:${pct}%"></div></div><span class="sm muted"><b>${bn(n)}</b> / ${bn(questions.length)}</span></div>`;}
  function options(question,answers,scope,entity){return `<div class="question"><div class="question-top"><span class="qnum">${ico('check',13)}</span><span class="qtitle">${esc(question.q)}</span></div><div class="option-row" role="radiogroup" aria-label="${esc(question.q)}">${question.options.map(o=>`<label class="choice"><input type="radio" name="${scope}-${esc(entity)}-${question.id}" data-scope="${scope}" data-entity="${esc(entity)}" data-question="${question.id}" value="${o.v}" ${answers?.[question.id]===o.v?'checked':''}><span>${esc(o.t)}</span></label>`).join('')}</div></div>`;}

  function dailyView(){
    const family=ownFamily();if(!family)return emptyState('এই account-এর সঙ্গে কোনো family যুক্ত নেই।');
    if(!state.dailyTarget)state.dailyTarget=state.learners[0]?.id||'family';
    const learner=state.learners.find(x=>x.id===state.dailyTarget);
    const isFamily=state.dailyTarget==='family'||!learner;
    const record=isFamily?familyEntry(family.id):learnerEntry(learner.id);
    const questions=isFamily?FAMILY_ACTIVITIES:questionsFor(learner);
    if(isFamily&&state.noteDraft===''){state.noteDraft=record.note||'';state.shareDraft=state.sharedNotes.some(x=>x.family_id===family.id&&x.entry_date===state.date);}
    return `${hero('আজকের ডায়েরি','প্রতিদিন অল্প কয়েকটি প্রশ্ন—সন্তান ও পরিবারের সৎ আত্মপর্যালোচনা।','অভিভাবক · ব্যক্তিগত account')}<div class="heading-row"><div><h2 class="section-title">Daily Diary</h2><p class="section-description">উত্তর নির্বাচন করলে নিরাপদ database-এ সংরক্ষিত হবে।</p></div>${dateControl()}</div><div class="tabbar">${state.learners.map(x=>`<button class="tab ${learner?.id===x.id?'active':''}" data-daily-target="${esc(x.id)}">${esc(x.alias)}<small>${esc(LEVELS[x.level])}</small></button>`).join('')}<button class="tab ${isFamily?'active':''}" data-daily-target="family">অভিভাবক<small>একটি family diary</small></button></div><section class="card form-card"><div class="card-head"><div><div class="tinycaps">${isFamily?'FAMILY REFLECTION':'LEARNER REFLECTION'}</div><h2>${isFamily?'অভিভাবকের দৈনিক আত্মপর্যালোচনা':`${esc(learner.alias)} · ${esc(LEVELS[learner.level])}`}</h2><p class="sm muted">${isFamily?'পরিবারে যত শিশু থাকুক, দিনে একবার পূরণ করলেই হবে।':'বয়স ও শেখার স্তর অনুযায়ী নির্ধারিত কার্যক্রম।'}</p></div><span class="badge ${countAnswers(record.answers,questions)===questions.length?'good':'gray'}">${countAnswers(record.answers,questions)===questions.length?'আজ পূর্ণ হয়েছে':'চলমান'}</span></div><div class="questions">${questions.map(q=>options(q,record.answers,isFamily?'family':'learner',isFamily?family.id:learner.id)).join('')}</div>${progress(record.answers,questions)}${isFamily?`<div class="divider"></div><label class="field-label" for="family-note">ঐচ্ছিক নোট</label><textarea id="family-note" class="textarea" maxlength="1200" placeholder="আলোচনার বিষয় বা অগ্রগতির ছোট নোট…">${esc(state.noteDraft)}</textarea><label class="checklabel"><input id="share-note" type="checkbox" ${state.shareDraft?'checked':''}><span><b>এই নোটটি নির্ধারিত শিক্ষকের সঙ্গে শেয়ার করুন</b><br><span class="muted">টিক না দিলে শিক্ষক নোটটি দেখতে পারবেন না।</span></span></label><div class="actionbar"><span class="sm muted">উত্তর আলাদাভাবে auto-save হয়।</span><button class="btn" data-action="save-family-note">নোট সংরক্ষণ</button></div>`:'<p class="footnote">শিক্ষক জমা দেওয়া উত্তর পড়তে পারবেন। উত্তর কোনো নম্বর বা ধর্মীয় মর্যাদা নির্ধারণ করে না।</p>'}</section>`;
  }

  function weekStrip(learner){return `<div class="weekstrip">${weekDays().map(d=>{const row=learnerEntry(learner.id,d),qs=questionsFor(learner),n=countAnswers(row.answers,qs),done=n===qs.length;return `<div class="daycard ${d===TODAY?'today':''}"><span class="day">${dayShort(d)}</span><span class="number">${bn(Number(d.slice(8)))}</span><span class="dot ${done?'done':n?'partial':''}">${done?'✓':n?'•':'–'}</span><span class="count">${bn(n)}/${bn(qs.length)}</span></div>`;}).join('')}</div>`;}
  function weekMatrix(learner){const qs=questionsFor(learner);return `<div class="table-scroll"><table class="table week-matrix"><thead><tr><th>কার্যক্রম</th>${weekDays().map(d=>`<th>${dayShort(d)}<br>${bn(Number(d.slice(8)))}</th>`).join('')}</tr></thead><tbody>${qs.map(q=>`<tr><td>${esc(q.q)}</td>${weekDays().map(d=>{const v=learnerEntry(learner.id,d).answers?.[q.id];return `<td><span class="${v===undefined?'muted':''}">${esc(v===undefined?'—':answerText(q,v))}</span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;}
  function weekView(){
    const learner=state.learners.find(x=>x.id===state.selectedLearner)||state.learners[0];if(!learner)return emptyState('কোনো শিক্ষার্থী যুক্ত নেই।');state.selectedLearner=learner.id;
    return `${hero('আমাদের সপ্তাহ','গত সাত দিনের জমা দেওয়া উত্তর পাশাপাশি দেখুন—স্কোর নয়, শুধু ধারাবাহিকতা।','Family view · last 7 days')}<div class="heading-row"><div><h2 class="section-title">My Week</h2><p class="section-description">শিশু বেছে নিয়ে প্রকৃত উত্তর দেখুন।</p></div>${dateControl()}</div><div class="tabbar">${state.learners.map(x=>`<button class="tab ${x.id===learner.id?'active':''}" data-select-learner="${esc(x.id)}">${esc(x.alias)}<small>${esc(LEVELS[x.level])}</small></button>`).join('')}</div><section class="card form-card"><div class="card-head"><div><h2>${esc(learner.alias)} · ${esc(LEVELS[learner.level])}</h2><p class="sm muted">${dateName(offsetDay(state.date,-6))} — ${dateName(state.date)}</p></div></div>${weekStrip(learner)}${weekMatrix(learner)}<p class="footnote">‘—’ মানে উত্তর জমা হয়নি। এটি শিশুর আমল বা চরিত্রের নম্বর নয়।</p></section>`;
  }

  function overviewView(){
    const groups=Object.keys(LEVELS).map(level=>({level,learners:state.learners.filter(x=>x.level===level)}));
    return `${hero('ক্লাসের সারাংশ','তিনটি স্তরের নির্ধারিত শিক্ষার্থীদের জমা দেওয়া উত্তর দেখুন।','Teacher · read-only access')}<div class="heading-row"><div><h2 class="section-title">Class Overview</h2><p class="section-description">প্রতি স্তরে সর্বোচ্চ ৫ জন · আজকের জমা</p></div>${dateControl()}</div><div class="level-grid">${groups.map(g=>`<section class="level-card"><div class="card-head"><div><h3>${esc(LEVELS[g.level])}</h3><span class="xs muted">${bn(g.learners.length)} / ৫ জন</span></div><span class="badge ${g.learners.length===5?'warn':'good'}">${g.learners.length===5?'পূর্ণ':'স্থান আছে'}</span></div><div class="student-list">${g.learners.map(l=>{const row=learnerEntry(l.id),qs=questionsFor(l),n=countAnswers(row.answers,qs);return `<button class="student-button" data-open-answer="${esc(l.id)}"><span><span class="name">${esc(l.alias)}</span><br><span class="xs muted">${n===qs.length?'পূর্ণ হয়েছে':n?'আংশিক':'জমা হয়নি'}</span></span><span class="badge ${n===qs.length?'good':'gray'}">${bn(n)}/${bn(qs.length)}</span></button>`;}).join('')}${Array.from({length:Math.max(0,5-g.learners.length)},()=>'<div class="empty-slot">খালি pilot slot</div>').join('')}</div><p class="limit-note">Database cap: এই স্তরে ষষ্ঠ active learner যোগ করা যাবে না।</p></section>`).join('')}</div><section class="card" style="margin-top:16px"><div class="card-head"><div><h2>শেয়ার করা family notes</h2><p class="sm muted">অভিভাবক স্পষ্টভাবে share করলে তবেই এখানে আসে।</p></div><span class="badge gray">${bn(state.sharedNotes.length)}টি</span></div>${state.sharedNotes.length?state.sharedNotes.slice().sort((a,b)=>b.entry_date.localeCompare(a.entry_date)).map(n=>{const fam=state.families.find(f=>f.id===n.family_id);return `<div class="comment"><div class="details-head"><strong class="sm">${esc(fam?.alias||'Family')}</strong><span class="xs muted">${dateName(n.entry_date)}</span></div><p>${esc(n.note)}</p></div>`;}).join(''):'<div class="placeholder">এই সাত দিনে কোনো note share করা হয়নি।</div>'}</section>`;
  }

  function answersView(){
    const learner=state.learners.find(x=>x.id===state.selectedLearner)||state.learners[0];if(!learner)return emptyState('কোনো শিক্ষার্থী assigned নেই।');state.selectedLearner=learner.id;
    const row=learnerEntry(learner.id),qs=questionsFor(learner),family=state.families.find(f=>f.id===learner.family_id);
    return `${hero('শিক্ষার্থীর উত্তর','পরিবার যে উত্তর জমা দিয়েছে তা হুবহু পড়ুন—সম্পাদনা করা যাবে না।','Teacher · read only')}<div class="heading-row"><div><h2 class="section-title">Student Answers</h2><p class="section-description">${esc(family?.alias||'Family')} · ${esc(LEVELS[learner.level])}</p></div>${dateControl()}</div><div class="tabbar">${state.learners.map(x=>`<button class="tab ${x.id===learner.id?'active':''}" data-select-learner="${esc(x.id)}">${esc(x.alias)}<small>${esc(LEVELS[x.level])}</small></button>`).join('')}</div><section class="card form-card"><div class="card-head"><div><div class="tinycaps">READ-ONLY SUBMISSION</div><h2>${esc(learner.alias)} · ${dateName(state.date)}</h2></div><span class="badge ${countAnswers(row.answers,qs)===qs.length?'good':'gray'}">${bn(countAnswers(row.answers,qs))} / ${bn(qs.length)} উত্তর</span></div>${qs.map(q=>{const v=row.answers?.[q.id];return `<div class="answer-readonly"><b>${esc(q.q)}</b><span class="answer-value ${v===undefined?'missing':''}">${esc(answerText(q,v))}</span></div>`;}).join('')}<p class="footnote">শিক্ষক এখানে উত্তর পরিবর্তন করতে পারবেন না। পর্যবেক্ষণকে শাস্তি, ranking বা শিশুর ধর্মীয় মান নির্ধারণে ব্যবহার করবেন না।</p></section>`;
  }

  function privacyView(){
    const contact=CONFIG.privacyContact?`mailto:${encodeURIComponent(CONFIG.privacyContact)}?subject=${encodeURIComponent('Muslimer Pathshala pilot — data request')}`:'';
    const responsible=CONFIG.responsibleName?`<p class="sm muted"><b>দায়িত্বপ্রাপ্ত ব্যক্তি:</b> ${esc(CONFIG.responsibleName)}</p>`:'';
    return `${hero('Privacy & Data','কে কী দেখতে পারে, কতদিন রাখা হয় এবং কীভাবে copy বা deletion চাইবেন।','Small private pilot')}<div class="privacy-grid"><div class="privacy-item"><strong>সংগৃহীত তথ্য</strong><p>Alias, level, দৈনিক উত্তর, এবং optional family note। জন্মতারিখ, ঠিকানা বা শিশুর email প্রয়োজন নেই।</p></div><div class="privacy-item"><strong>কে দেখতে পারে</strong><p>অভিভাবক নিজের family; assigned শিক্ষক learner answers ও স্পষ্টভাবে share করা note।</p></div><div class="privacy-item"><strong>Retention</strong><p>Diary entry ${bn(CONFIG.retentionDays||90)} দিন পরে মুছে ফেলার database job দেওয়া আছে। Account/onboarding record আলাদাভাবে pilot শেষে সরাতে হবে।</p></div><div class="privacy-item"><strong>উদ্দেশ্য</strong><p>পরিবারের নিয়মিত আত্মপর্যালোচনা ও শিক্ষককে প্রয়োজনীয় follow-up করতে সাহায্য করা—কোনো scoring নয়।</p></div></div>${isParent()?`<section class="card" style="margin-top:16px"><h2>আপনার data copy</h2><p class="sm muted">বর্তমানে আপনার account-এ দেখা family, learner এবং গত সাত দিনের entry একটি JSON file হিসেবে নিন।</p><button class="btn secondary" data-action="export-data">Copy download করুন</button></section>`:''}<section class="card danger-zone" style="margin-top:16px"><h2>Access, correction বা deletion</h2>${responsible}<p class="sm muted">Pilot থেকে সরে যেতে, ভুল সংশোধন করতে বা data মুছতে সরাসরি pilot পরিচালকের সঙ্গে যোগাযোগ করুন।</p>${contact?`<a class="btn" href="${esc(contact)}">Email request</a>`:'<div class="status-panel">Launch-এর আগে <code>config.js</code>-এ privacyContact email যোগ করতে হবে।</div>'}</section>`;
  }
  function emptyState(message){return `${hero('ডায়েরি প্রস্তুত নয়',message,'Account setup')}<div class="card"><div class="locked">${ico('lock',24)}<p>${esc(message)}</p></div></div>`;}
  function pageContent(){if(isParent()){if(state.active==='week')return weekView();if(state.active==='privacy')return privacyView();return dailyView();}if(state.active==='answers')return answersView();if(state.active==='privacy')return privacyView();return overviewView();}

  function renderApp(){document.getElementById('app').innerHTML=shell(pageContent());}
  function applyData(data){
    const nextRole=data.profile?.role;
    Object.assign(state,data);
    if(state.lastRole!==nextRole)state.active=nextRole==='parent'?'daily':'overview';
    state.lastRole=nextRole;
    const allowed=nextRole==='parent'?['daily','week','privacy']:['overview','answers','privacy'];
    if(!allowed.includes(state.active))state.active=allowed[0];
    if(!state.selectedLearner)state.selectedLearner=state.learners[0]?.id||null;
    if(!state.dailyTarget)state.dailyTarget=state.learners[0]?.id||'family';
  }
  async function reload(){state.busy=true;state.error='';renderApp();try{applyData(await backend.load(state.date,state.session.user.id));}catch(e){state.error=friendlyError(e);}finally{state.busy=false;renderCurrent();}}
  function renderCurrent(){if(!state.session)return renderLogin();if(!state.profile)return renderLogin();if(isParent()&&!consentComplete())return renderConsent();renderApp();}
  function friendlyError(error){const text=String(error?.message||error||'Unknown error');if(/Invalid login credentials|User not found|Signups not allowed for otp/i.test(text))return 'এই email এখনো pilot-এ আমন্ত্রিত নয়। প্রথমে pilot পরিচালকের সঙ্গে যোগাযোগ করুন।';return text;}
  async function saveLearnerAnswer(input){
    if(!isParent())return;const learner=state.learners.find(x=>x.id===input.dataset.entity);if(!learner)return;
    const current={...learnerEntry(learner.id).answers,[input.dataset.question]:input.value};state.busy=true;renderApp();
    try{const row=await backend.saveLearner(learner.id,state.date,current,state.session.user.id);upsertLocal('learnerEntries',row,'learner_id');showToast('উত্তর সংরক্ষিত হয়েছে');}catch(e){state.error=friendlyError(e);}finally{state.busy=false;renderApp();}
  }
  async function saveFamilyAnswer(input){
    if(!isParent())return;captureNoteDraft();const family=ownFamily();const current={...familyEntry(family.id).answers,[input.dataset.question]:input.value};state.busy=true;renderApp();
    try{const row=await backend.saveFamily(family.id,state.date,current,state.noteDraft,state.shareDraft,state.session.user.id);upsertLocal('familyEntries',row,'family_id');await reload();showToast('উত্তর সংরক্ষিত হয়েছে');}catch(e){state.error=friendlyError(e);state.busy=false;renderApp();}
  }
  function upsertLocal(collection,row,idField){const list=state[collection],i=list.findIndex(x=>entryKey(x[idField],x.entry_date)===entryKey(row[idField],row.entry_date));if(i<0)list.push(row);else list[i]=row;}

  document.addEventListener('submit',async e=>{
    if(e.target.id!=='login-form')return;e.preventDefault();state.busy=true;state.error='';state.notice='';renderLogin();
    try{await backend.sendMagicLink(new FormData(e.target).get('email'));state.notice='Email পাঠানো হয়েছে। একই browser-এ link খুলুন।';}catch(err){state.error=friendlyError(err);}finally{state.busy=false;renderLogin();}
  });
  document.addEventListener('click',async e=>{
    const page=e.target.closest('[data-page]');if(page){captureNoteDraft();state.active=page.dataset.page;state.error='';renderApp();window.scrollTo({top:0,behavior:'instant'});return;}
    const demo=e.target.closest('[data-demo-role]');if(demo){await backend.chooseRole(demo.dataset.demoRole);state.session=await backend.getSession();await reload();return;}
    const daily=e.target.closest('[data-daily-target]');if(daily){captureNoteDraft();state.dailyTarget=daily.dataset.dailyTarget;state.noteDraft='';state.shareDraft=false;renderApp();return;}
    const select=e.target.closest('[data-select-learner]');if(select){state.selectedLearner=select.dataset.selectLearner;renderApp();return;}
    const open=e.target.closest('[data-open-answer]');if(open){state.selectedLearner=open.dataset.openAnswer;state.active='answers';renderApp();return;}
    const action=e.target.closest('[data-action]');if(!action)return;
    if(action.dataset.action==='logout'){await backend.logout();Object.assign(state,{session:null,profile:null,error:'',notice:'',busy:false});renderLogin();return;}
    if(action.dataset.action==='accept-consent'){
      if(!document.getElementById('consent-box')?.checked)return;state.busy=true;renderConsent();
      try{await backend.acceptConsent(state.families.map(f=>f.id),CONFIG.consentVersion,state.session.user.id);await reload();}catch(err){state.error=friendlyError(err);state.busy=false;renderConsent();}return;
    }
    if(action.dataset.action==='save-family-note'){
      captureNoteDraft();const family=ownFamily(),record=familyEntry(family.id);state.busy=true;renderApp();
      try{const row=await backend.saveFamily(family.id,state.date,record.answers||{},state.noteDraft,state.shareDraft,state.session.user.id);upsertLocal('familyEntries',row,'family_id');await reload();showToast('নোট সংরক্ষিত হয়েছে');}catch(err){state.error=friendlyError(err);state.busy=false;renderApp();}return;
    }
    if(action.dataset.action==='export-data'){
      const payload={exported_at:new Date().toISOString(),profile:{display_name:state.profile.display_name,role:state.profile.role},families:state.families,learners:state.learners,learner_entries:state.learnerEntries,family_entries:state.familyEntries,consents:state.consents};
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`muslimer-pathshala-data-${TODAY}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
  });
  document.addEventListener('change',async e=>{
    const el=e.target;
    if(el.id==='consent-box'){const button=document.querySelector('[data-action="accept-consent"]');if(button)button.disabled=!el.checked;return;}
    if(el.id==='date-control'){if(!/^\d{4}-\d{2}-\d{2}$/.test(el.value)||el.value>TODAY||el.value<offsetDay(TODAY,-89)){showToast('গত ৯০ দিনের মধ্যে একটি তারিখ বেছে নিন');renderApp();return;}captureNoteDraft();state.date=el.value;state.noteDraft='';state.shareDraft=false;await reload();return;}
    if(el.id==='share-note'){state.shareDraft=el.checked;return;}
    if(el.matches('input[data-scope="learner"]')){await saveLearnerAnswer(el);return;}
    if(el.matches('input[data-scope="family"]')){await saveFamilyAnswer(el);}
  });

  async function start(){
    if(!['setup','demo','supabase'].includes(CONFIG.mode)){renderFatal('config.js-এ mode ভুল।');return;}
    if(CONFIG.mode==='setup')return renderSetup();
    if(CONFIG.mode==='demo')backend=new DemoBackend();
    else {
      if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.supabaseUrl||'')||!CONFIG.supabaseAnonKey)return renderSetup();
      try{const module=await import(CONFIG.supabaseJsUrl);backend=new SupabaseBackend(module.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey,{auth:{persistSession:true,detectSessionInUrl:true,autoRefreshToken:true}}));}
      catch(e){renderFatal(`Supabase library load হয়নি।\n${friendlyError(e)}`);return;}
    }
    try{state.session=await backend.getSession();if(!state.session)return renderLogin();await reload();}
    catch(e){state.error=friendlyError(e);renderLogin();}
  }
  function renderFatal(message){document.getElementById('app').innerHTML=`<main class="auth-page"><section class="auth-card"><h1>App চালু করা যায়নি</h1><div class="status-panel error fatal">${esc(message)}</div></section></main>`;}

  start();
})();
