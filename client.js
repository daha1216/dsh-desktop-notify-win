window.__ModuleLoader__.load({
  id: 'dsh-desktop-notify-win',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const ENDPOINT = '/dsh-desktop-notify/api/config'

    const page = { padding: '24px', maxWidth: '680px', display: 'grid', gap: '18px' }
    const row = { display: 'grid', gridTemplateColumns: '210px 1fr', alignItems: 'center', gap: '16px' }
    const labelStyle = { color: 'var(--dsw-alias-label-primary)', fontSize: '13px' }
    const hintStyle = { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', marginTop: '3px', lineHeight: 1.5 }
    const sectionStyle = {
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '12px',
      padding: '16px',
      display: 'grid',
      gap: '14px',
      background: 'var(--dsw-alias-bg-layer-1, transparent)',
    }
    const inputStyle = {
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '8px',
      padding: '6px 8px',
      fontSize: '13px',
      width: '100%',
      boxSizing: 'border-box',
    }
    const primaryButton = {
      background: '#1f6beb',
      color: '#ffffff',
      border: '1px solid #1f6beb',
      borderRadius: '8px',
      padding: '8px 18px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    }
    const secondaryButton = {
      background: 'transparent',
      color: 'var(--dsw-alias-label-primary)',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '13px',
      cursor: 'pointer',
    }

    const PRESETS = [
      {
        id: 'classic',
        name: '经典深色',
        desc: '默认外观，蓝条深底',
        values: {
          accent: '#1f6beb',
          background: '#202020',
          text: '#ffffff',
          opacity: 0.97,
          width: 400,
          corner: 'br',
          marginX: 16,
          marginY: 16,
        },
      },
      {
        id: 'light',
        name: '系统浅色',
        desc: '浅底深字，白天更清爽',
        values: {
          accent: '#1f6beb',
          background: '#f2f2f2',
          text: '#1f1f1f',
          opacity: 0.98,
          width: 400,
          corner: 'br',
          marginX: 16,
          marginY: 16,
        },
      },
      {
        id: 'mono',
        name: '极简灰',
        desc: '低调，不抢注意力',
        values: {
          accent: '#8a8a8a',
          background: '#2b2b2b',
          text: '#f2f2f2',
          opacity: 0.95,
          width: 380,
          corner: 'br',
          marginX: 16,
          marginY: 16,
        },
      },
      {
        id: 'contrast',
        name: '高对比',
        desc: '黑底黄条，强提醒',
        values: {
          accent: '#ffd400',
          background: '#000000',
          text: '#ffffff',
          opacity: 1,
          width: 420,
          corner: 'br',
          marginX: 12,
          marginY: 12,
        },
      },
    ]

    function luminance(hex) {
      const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
      if (!match) return 0
      const value = parseInt(match[1], 16)
      const r = (value >> 16) & 255
      const g = (value >> 8) & 255
      const b = value & 255
      return (r * 299 + g * 587 + b * 114) / 1000
    }

    function Section(props) {
      return h(
        'section',
        { style: sectionStyle },
        h(
          'div',
          null,
          h('div', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: 600 } }, props.title),
          props.hint ? h('div', { style: hintStyle }, props.hint) : null,
        ),
        props.children,
      )
    }

    function Field(props) {
      return h(
        'div',
        { style: row },
        h(
          'div',
          null,
          h('div', { style: labelStyle }, props.title),
          props.desc ? h('div', { style: hintStyle }, props.desc) : null,
        ),
        h('div', null, props.children),
      )
    }

    function ColorField(props) {
      return h(
        'div',
        { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        h('input', {
          type: 'color',
          value: props.value,
          'aria-label': props.title,
          onChange: (event) => props.onChange(event.target.value),
          style: {
            width: '44px',
            height: '30px',
            padding: '0',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
          },
        }),
        h('input', {
          type: 'text',
          value: props.value,
          'aria-label': props.title,
          onChange: (event) => props.onChange(event.target.value),
          style: Object.assign({}, inputStyle, { width: '130px' }),
        }),
      )
    }

    function PresetCard(props) {
      const preset = props.preset
      const active = props.active
      return h(
        'button',
        {
          type: 'button',
          onClick: () => props.onPick(preset),
          'aria-pressed': active,
          style: {
            textAlign: 'left',
            padding: '10px 12px',
            borderRadius: '10px',
            border: active ? '2px solid var(--dsw-alias-brand-primary)' : '1px solid var(--dsw-alias-border-l1)',
            background: 'var(--dsw-alias-bg-layer-2)',
            cursor: 'pointer',
            display: 'grid',
            gap: '6px',
            font: 'inherit',
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', {
            style: {
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              border: '1px solid ' + preset.values.accent,
              background: 'linear-gradient(90deg, ' + preset.values.accent + ' 0 4px, ' + preset.values.background + ' 4px 100%)',
              display: 'inline-block',
              flex: '0 0 auto',
            },
          }),
          h(
            'span',
            { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '13px', fontWeight: active ? 600 : 500 } },
            preset.name,
          ),
        ),
        h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '11.5px', lineHeight: 1.45 } }, preset.desc),
      )
    }

    function ToastPreview(props) {
      const settings = props.settings
      const boxRef = React.useRef(null)
      const [boxWidth, setBoxWidth] = React.useState(620)

      React.useEffect(() => {
        const element = boxRef.current
        if (!element) return undefined
        const update = () => setBoxWidth(element.clientWidth || 620)
        update()
        let observer
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(update)
          observer.observe(element)
        }
        window.addEventListener('resize', update)
        return () => {
          if (observer) observer.disconnect()
          window.removeEventListener('resize', update)
        }
      }, [])

      const cardWidth = Math.max(240, Math.min(720, Number(settings.width) || 400))
      const scale = Math.max(0.2, Math.min(1, (boxWidth - 36) / cardWidth))
      const corner = settings.corner || 'br'
      const vertical = corner.charAt(0) === 'b' ? 'bottom' : 'top'
      const horizontal = corner.charAt(1) === 'r' ? 'right' : 'left'
      const sub = luminance(settings.background) > 140 ? '#3c3c3c' : '#cdcdcd'
      const position = {}
      position[horizontal] = Math.max(0, Number(settings.marginX) || 0) + 'px'
      position[vertical] = Math.max(0, Number(settings.marginY) || 0) + 'px'
      const opacity = Math.max(0.5, Math.min(1, Number(settings.opacity) || 1))

      return h(
        'div',
        { ref: boxRef, style: { position: 'relative', height: '220px', borderRadius: '12px', border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden' } },
        h(
          'div',
          { style: { position: 'absolute', top: '10px', left: '14px', color: 'var(--dsw-alias-label-secondary)', fontSize: '11.5px' } },
          '鼠标所在显示器（示意）',
        ),
        h(
          'div',
          {
            style: Object.assign(
              {
                position: 'absolute',
                width: cardWidth + 'px',
                height: '112px',
                background: settings.background,
                borderRadius: '6px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.32)',
                opacity: opacity,
                transform: 'scale(' + scale + ')',
                transformOrigin: vertical + ' ' + horizontal,
                overflow: 'hidden',
                pointerEvents: 'none',
                fontFamily: '"Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif',
              },
              position,
            ),
          },
          h('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: settings.accent } }),
          h(
            'div',
            { style: { padding: '14px 20px 0 20px' } },
            h('div', { style: { color: settings.text, fontSize: '15px', fontWeight: 600, lineHeight: '20px' } }, 'DSH · 本轮完成'),
            h(
              'div',
              { style: { color: sub, fontSize: '13px', lineHeight: '18px', marginTop: '4px', whiteSpace: 'pre-line' } },
              '会话：整理本周计划\n会话已空闲，切回去看看。',
            ),
          ),
        ),
      )
    }

    function SettingsPage() {
      const [settings, setSettings] = React.useState(null)
      const [saved, setSaved] = React.useState(null)
      const [status, setStatus] = React.useState('')
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        fetch(ENDPOINT, { cache: 'no-store' })
          .then((response) => response.json())
          .then((data) => {
            if (alive) {
              setSettings(data)
              setSaved(data)
            }
          })
          .catch(() => {
            if (alive) setStatus('读取设置失败，请刷新页面重试')
          })
        return () => {
          alive = false
        }
      }, [])

      if (!settings) {
        return h(
          'div',
          { style: { padding: '24px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } },
          status || '加载中…',
        )
      }

      const patch = (next) => setSettings(Object.assign({}, settings, next))
      const dirty = saved ? JSON.stringify(saved) !== JSON.stringify(settings) : false

      const post = async (payload) => {
        setBusy(true)
        try {
          const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          const data = await response.json()
          if (payload.action === 'test') {
            setStatus('已按页面上的当前值弹出测试通知。')
          } else {
            setSettings(data)
            setSaved(data)
            setStatus('已保存，新的通知样式立即生效，不用重启 DSH。')
          }
        } catch (error) {
          setStatus('操作失败：' + String(error))
        } finally {
          setBusy(false)
        }
      }

      const save = () => post({ action: 'save', settings })
      const test = () => post({ action: 'test', settings })

      const isActivePreset = (preset) =>
        Object.keys(preset.values).every((key) => Number(settings[key]) === Number(preset.values[key]) || settings[key] === preset.values[key])

      const pickPreset = (preset) => {
        patch(preset.values)
        setStatus('已套用「' + preset.name + '」，点“保存”后生效。')
      }

      return h(
        'div',
        { style: page },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' } },
          h(
            'div',
            null,
            h('div', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '17px', fontWeight: 600 } }, '桌面通知'),
            h(
              'div',
              { style: Object.assign({}, hintStyle, { marginTop: '6px' }) },
              '会话完成、需要你回答或确认时，在鼠标所在显示器的角落弹一张卡片。先选一套样式，再按需要微调。',
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 } },
            h('button', { type: 'button', style: primaryButton, disabled: busy, onClick: save }, dirty ? '保存修改' : '保存'),
            h('button', { type: 'button', style: secondaryButton, disabled: busy, onClick: test }, '测试通知'),
          ),
        ),
        h(
          'div',
          { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', minHeight: '18px' } },
          status ? h('span', { role: 'status', style: hintStyle }, status) : null,
          dirty ? h('span', { style: { color: 'var(--dsw-alias-brand-primary)', fontSize: '12px', fontWeight: 600 } }, '● 有未保存的修改') : null,
        ),
        h(
          Section,
          { title: '快速样式', hint: '会同时改颜色、宽度和弹出位置；选中后还能继续微调。' },
          h(
            'div',
            { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' } },
            PRESETS.map((preset) =>
              h(PresetCard, {
                key: preset.id,
                preset: preset,
                active: isActivePreset(preset),
                onPick: pickPreset,
              }),
            ),
          ),
        ),
        h(
          Section,
          { title: '实时预览', hint: '跟着下面的设置即时变化；预览按比例缩放，真实卡片以弹窗为准。' },
          h(ToastPreview, { settings: settings }),
          h(
            'div',
            { style: hintStyle },
            Math.round(settings.durationMs / 1000) + ' 秒后自动消失 · ' + (settings.sound ? '有提示音' : '静音') + ' · ' + settings.width + ' × 112 像素',
          ),
        ),
        h(
          Section,
          { title: '外观' },
          h(Field, { title: '左侧色条', desc: '卡片左边那条竖线的颜色，用来区分提醒类型' },
            h(ColorField, {
              title: '左侧色条',
              value: settings.accent,
              onChange: (value) => patch({ accent: value }),
            })),
          h(Field, { title: '卡片底色', desc: '浅色底会自动换成深色小字' },
            h(ColorField, {
              title: '卡片底色',
              value: settings.background,
              onChange: (value) => patch({ background: value }),
            })),
          h(Field, { title: '文字颜色', desc: '标题和正文的颜色' },
            h(ColorField, {
              title: '文字颜色',
              value: settings.text,
              onChange: (value) => patch({ text: value }),
            })),
          h(Field, { title: '卡片宽度', desc: '240 – 720 像素，越宽字越舒展' },
            h('input', {
              type: 'number',
              min: 240,
              max: 720,
              step: 10,
              value: settings.width,
              onChange: (event) => patch({ width: Number(event.target.value) }),
              style: Object.assign({}, inputStyle, { width: '120px' }),
            })),
          h(Field, { title: '透明度', desc: '0.5 半透明，1 完全不透明' },
            h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
              h('input', {
                type: 'range',
                min: 0.5,
                max: 1,
                step: 0.01,
                value: settings.opacity,
                onChange: (event) => patch({ opacity: Number(event.target.value) }),
                style: { width: '180px' },
              }),
              h('span', { style: hintStyle }, Number(settings.opacity).toFixed(2)))),
        ),
        h(
          Section,
          { title: '弹出与停留' },
          h(Field, { title: '显示多久', desc: '3 – 120 秒；鼠标移上去会暂停计时' },
            h('input', {
              type: 'number',
              min: 3,
              max: 120,
              step: 1,
              value: Math.round(settings.durationMs / 1000),
              onChange: (event) => patch({ durationMs: Number(event.target.value) * 1000 }),
              style: Object.assign({}, inputStyle, { width: '120px' }),
            })),
          h(Field, { title: '弹出位置', desc: '相对鼠标所在显示器的角' },
            h('select', {
              value: settings.corner,
              onChange: (event) => patch({ corner: event.target.value }),
              style: Object.assign({}, inputStyle, { width: '180px' }),
            },
              h('option', { value: 'br' }, '右下角'),
              h('option', { value: 'bl' }, '左下角'),
              h('option', { value: 'tr' }, '右上角'),
              h('option', { value: 'tl' }, '左上角'),
            )),
          h(Field, { title: '离屏幕边缘', desc: '边距越大，卡片离屏幕角越远' },
            h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
              h('input', {
                type: 'number',
                min: 0,
                max: 400,
                value: settings.marginX,
                onChange: (event) => patch({ marginX: Number(event.target.value) }),
                style: Object.assign({}, inputStyle, { width: '90px' }),
              }),
              h('span', { style: hintStyle }, '水平'),
              h('input', {
                type: 'number',
                min: 0,
                max: 400,
                value: settings.marginY,
                onChange: (event) => patch({ marginY: Number(event.target.value) }),
                style: Object.assign({}, inputStyle, { width: '90px' }),
              }),
              h('span', { style: hintStyle }, '垂直'))),
          h(Field, { title: '提示音', desc: '弹出时响一声，开会时可以关掉' },
            h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--dsw-alias-label-primary)', fontSize: '13px', cursor: 'pointer' } },
              h('input', {
                type: 'checkbox',
                checked: Boolean(settings.sound),
                onChange: (event) => patch({ sound: event.target.checked }),
              }),
              settings.sound ? '开' : '关')),
        ),
        h(
          'div',
          { style: hintStyle },
          '保存立即生效，不用重启 DSH；测试通知用页面上的当前值，可以先试再保存。',
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: 'desktop-notify', order: 30, label: '桌面通知' },
            SettingsPage,
          ),
        )
      },
    }
  },
})
