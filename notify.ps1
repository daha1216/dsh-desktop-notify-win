param([switch]$Quiet, [switch]$Diagnose)

$ErrorActionPreference = 'Stop'

$title = if ($env:DSH_NOTIFY_TITLE) { $env:DSH_NOTIFY_TITLE } else { 'DeepSeek Harness' }
$body = if ($env:DSH_NOTIFY_BODY) { $env:DSH_NOTIFY_BODY } else { '' }
$timeoutMs = 20000
if ($env:DSH_NOTIFY_MS) { [int]::TryParse($env:DSH_NOTIFY_MS, [ref]$timeoutMs) | Out-Null }
$logPath = if ($env:DSH_NOTIFY_LOG) { $env:DSH_NOTIFY_LOG } else { Join-Path $env:TEMP 'dsh-notify-click.log' }

Add-Type -ReferencedAssemblies System.Windows.Forms, System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class DshActions
{
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr lp);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern int GetWindowThreadProcessId(IntPtr h, IntPtr pid);
    [DllImport("user32.dll")] static extern int GetWindowThreadProcessId(IntPtr h, out int pid);
    [DllImport("user32.dll")] static extern int GetClassName(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(int idAttach, int idAttachTo, bool fAttach);
    [DllImport("kernel32.dll")] static extern int GetCurrentThreadId();
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);

    public delegate bool EnumProc(IntPtr h, IntPtr lp);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    [ComImport, Guid("A5CD92FF-29BE-454C-8D04-D82879FB3F1B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktopManager
    {
        [return: MarshalAs(UnmanagedType.Bool)]
        bool IsWindowOnCurrentVirtualDesktop(IntPtr topLevelWindow);
        Guid GetWindowDesktopId(IntPtr topLevelWindow);
        void MoveWindowToDesktop(IntPtr topLevelWindow, ref Guid desktopId);
    }

    [ComImport, Guid("AA509086-5CA9-4C25-8F95-589D3C07B48A")]
    class VirtualDesktopManagerClass { }

    [ComImport, Guid("6D5140C1-7436-11CE-8034-00AA006009FA"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IServiceProvider { void QueryService(ref Guid service, ref Guid riid, out IntPtr ppv); }

    [ComImport, Guid("C2F03A33-21F5-47FA-B4BB-156362A2F239")]
    class ImmersiveShell { }

    [ComImport, Guid("3F07F4BE-B107-441A-AF0F-39D82529072C"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktop
    {
        bool IsViewVisible(IntPtr view);
        Guid GetId();
    }

    [ComImport, Guid("92CA9DCD-5622-4bba-A805-5E9F541BD8C9"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IObjectArray
    {
        uint GetCount();
        void GetAt(uint index, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out object ppv);
    }

    // Vtable order matters: GetCount, MoveViewToDesktop, CanViewMoveDesktops,
    // GetCurrentDesktop, GetDesktops, GetAdjacentDesktop, SwitchDesktop.
    [ComImport, Guid("53F5CA0B-158F-4124-900C-057158060B27"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IVirtualDesktopManagerInternal
    {
        int GetCount();
        void MoveViewToDesktop(IntPtr view, IVirtualDesktop desktop);
        bool CanViewMoveDesktops(IntPtr view);
        IVirtualDesktop GetCurrentDesktop();
        void GetDesktops(out IObjectArray desktops);
        [PreserveSig] int GetAdjacentDesktop(IVirtualDesktop from, int direction, out IVirtualDesktop desktop);
        void SwitchDesktop(IVirtualDesktop desktop);
    }

    public static string LogPath = "";

    public static void Log(string message)
    {
        try
        {
            if (String.IsNullOrEmpty(LogPath)) return;
            System.IO.File.AppendAllText(LogPath, DateTime.Now.ToString("o") + " " + message + Environment.NewLine);
        }
        catch { }
    }

    public static void KeepTop(IntPtr h)
    {
        try { SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010); } catch { }
    }

    // Older builds marked the DSH window HWND_TOPMOST and never cleared it.
    // Only a process at the same integrity level can undo that, which is why
    // this runs from the popup (spawned by the host) rather than from the agent shell.
    public static void ClearTopmost()
    {
        try
        {
            IntPtr t = FindDshWindow(Process.GetCurrentProcess().Id);
            if (t != IntPtr.Zero)
                SetWindowPos(t, new IntPtr(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);
        }
        catch { }
    }

    static IVirtualDesktopManager Vdm()
    {
        return (IVirtualDesktopManager)new VirtualDesktopManagerClass();
    }

    static string ProcName(int pid)
    {
        try { return Process.GetProcessById(pid).ProcessName; } catch { return "?"; }
    }

    static long Area(IntPtr h)
    {
        RECT r;
        if (!GetWindowRect(h, out r)) return 0;
        return (long)(r.Right - r.Left) * (r.Bottom - r.Top);
    }

    public static string[] DumpWindows()
    {
        var lines = new List<string>();
        EnumWindows((h, lp) =>
        {
            if (!IsWindowVisible(h)) return true;
            int pid;
            GetWindowThreadProcessId(h, out pid);
            long area = Area(h);
            if (area < 100 * 100) return true;
            var sb = new StringBuilder(256);
            GetClassName(h, sb, 256);
            var tb = new StringBuilder(256);
            GetWindowText(h, tb, 256);
            lines.Add("win hwnd=" + h + " pid=" + pid + " proc=" + ProcName(pid) + " class=" + sb + " title=" + tb + " area=" + area);
            return true;
        }, IntPtr.Zero);
        return lines.ToArray();
    }

    public static IntPtr FindDshWindow(int selfPid)
    {
        IntPtr best = IntPtr.Zero;
        long bestScore = 0;
        long bestArea = 0;
        EnumWindows((h, lp) =>
        {
            if (!IsWindowVisible(h)) return true;
            int pid;
            GetWindowThreadProcessId(h, out pid);
            if (pid == 0 || pid == selfPid) return true;
            string name = ProcName(pid);
            var sb = new StringBuilder(256);
            GetClassName(h, sb, 256);
            string cls = sb.ToString();
            var tb = new StringBuilder(256);
            GetWindowText(h, tb, 256);
            string title = tb.ToString();
            long area = Area(h);
            if (area < 200 * 200) return true;

            long score = 0;
            if (title.IndexOf("deepseek", StringComparison.OrdinalIgnoreCase) >= 0) score += 5;
            if (title.IndexOf("harness", StringComparison.OrdinalIgnoreCase) >= 0) score += 4;
            if (title.IndexOf("dsh", StringComparison.OrdinalIgnoreCase) >= 0) score += 2;
            if (cls.IndexOf("Chrome_WidgetWin", StringComparison.OrdinalIgnoreCase) >= 0) score += 1;
            if (name.IndexOf("deepseek", StringComparison.OrdinalIgnoreCase) >= 0) score += 3;
            if (score == 0) return true;

            Log("candidate hwnd=" + h + " proc=" + name + " class=" + cls + " title=" + title + " area=" + area + " score=" + score);
            if (score > bestScore || (score == bestScore && area > bestArea))
            {
                bestScore = score;
                bestArea = area;
                best = h;
            }
            return true;
        }, IntPtr.Zero);
        return best;
    }

    static void Chord(byte vk)
    {
        keybd_event(0x5B, 0, 0, UIntPtr.Zero);
        keybd_event(0x11, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
        keybd_event(0x11, 0, 2, UIntPtr.Zero);
        keybd_event(0x5B, 0, 2, UIntPtr.Zero);
        Thread.Sleep(450);
    }

    static bool OnCurrent(IVirtualDesktopManager vdm, IntPtr h)
    {
        try { return vdm.IsWindowOnCurrentVirtualDesktop(h); } catch { return true; }
    }

    static IVirtualDesktopManagerInternal Manager()
    {
        var sp = (IServiceProvider)new ImmersiveShell();
        var svc = new Guid("C5E0CDCA-7B6E-41B2-9FC4-D93975CC467B");
        var riid = new Guid("53F5CA0B-158F-4124-900C-057158060B27");
        IntPtr p;
        sp.QueryService(ref svc, ref riid, out p);
        return (IVirtualDesktopManagerInternal)Marshal.GetObjectForIUnknown(p);
    }

    static bool DirectSwitch(Guid targetDesktop)
    {
        try
        {
            var mgr = Manager();
            IObjectArray arr;
            mgr.GetDesktops(out arr);
            uint n = arr.GetCount();
            var iid = new Guid("3F07F4BE-B107-441A-AF0F-39D82529072C");
            for (uint i = 0; i < n; i++)
            {
                object o;
                arr.GetAt(i, ref iid, out o);
                var d = (IVirtualDesktop)o;
                if (d.GetId() == targetDesktop)
                {
                    mgr.SwitchDesktop(d);
                    Log("com-switch ok index=" + i);
                    return true;
                }
            }
            Log("com-desktop-not-found count=" + n);
        }
        catch (Exception e)
        {
            Log("com-failed " + e.GetType().Name + " " + e.Message);
        }
        return false;
    }

    public static string FocusDsh(IntPtr self)
    {
        Log("clicked; foreground=" + GetForegroundWindow());
        IntPtr target = FindDshWindow(Process.GetCurrentProcess().Id);
        if (target == IntPtr.Zero) { Log("no-dsh-window"); return "no-dsh-window"; }

        var vdm = Vdm();
        bool onCurrent = OnCurrent(vdm, target);
        Log("target=" + target + " onCurrent=" + onCurrent);

        bool switched = onCurrent;
        if (!onCurrent)
        {
            try
            {
                Guid targetDesktop = vdm.GetWindowDesktopId(target);
                switched = DirectSwitch(targetDesktop);
            }
            catch (Exception e) { Log("desktop-id-failed " + e.Message); }
        }
        if (!switched)
        {
            try
            {
                Guid current = vdm.GetWindowDesktopId(self);
                vdm.MoveWindowToDesktop(target, ref current);
                switched = true;
                Log("moved-window-to-current");
            }
            catch (Exception e) { Log("move-failed " + e.Message); }
        }

        // Only un-minimize. Never SW_RESTORE a normal/maximized window.
        if (IsIconic(target)) ShowWindow(target, 9);
        // Clean up any stale always-on-top left by older builds; keep size/position.
        SetWindowPos(target, new IntPtr(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010);

        int targetThread = GetWindowThreadProcessId(target, IntPtr.Zero);
        int selfThread = GetCurrentThreadId();
        AttachThreadInput(selfThread, targetThread, true);
        bool ok = SetForegroundWindow(target);
        BringWindowToTop(target);
        AttachThreadInput(selfThread, targetThread, false);
        Log("setForeground=" + ok + " finalForeground=" + GetForegroundWindow());
        return switched ? "switched" : "focus-only";
    }
}

public class DshToast : Form
{
    private System.Windows.Forms.Timer timer;
    private string screenName = "";
    private Rectangle screenBounds;

    static string Env(string name, string fallback)
    {
        var v = Environment.GetEnvironmentVariable(name);
        return String.IsNullOrEmpty(v) ? fallback : v;
    }

    static int EnvInt(string name, int fallback)
    {
        int v;
        return Int32.TryParse(Env(name, ""), out v) ? v : fallback;
    }

    static double EnvDouble(string name, double fallback)
    {
        double v;
        return Double.TryParse(Env(name, ""), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v) ? v : fallback;
    }

    static Color EnvColor(string name, Color fallback)
    {
        try { return ColorTranslator.FromHtml(Env(name, "")); } catch { return fallback; }
    }

    static int Luminance(Color c) { return (c.R * 299 + c.G * 587 + c.B * 114) / 1000; }

    public DshToast(string title, string body, int timeoutMs)
    {
        int width = Math.Max(240, Math.Min(720, EnvInt("DSH_NOTIFY_WIDTH", 400)));
        Color bg = EnvColor("DSH_NOTIFY_BG", Color.FromArgb(32, 32, 32));
        Color accent = EnvColor("DSH_NOTIFY_ACCENT", Color.FromArgb(31, 111, 235));
        Color fg = EnvColor("DSH_NOTIFY_TEXT", Color.White);
        Color sub = Luminance(bg) > 140 ? Color.FromArgb(60, 60, 60) : Color.FromArgb(205, 205, 205);
        double opacity = Math.Max(0.5, Math.Min(1.0, EnvDouble("DSH_NOTIFY_OPACITY", 0.97)));
        string corner = Env("DSH_NOTIFY_CORNER", "br");
        int mx = Math.Max(0, EnvInt("DSH_NOTIFY_MX", 16));
        int my = Math.Max(0, EnvInt("DSH_NOTIFY_MY", 16));

        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
        BackColor = bg;
        Size = new Size(width, 112);
        Opacity = opacity;

        var bar = new Panel { BackColor = accent, Dock = DockStyle.Left, Width = 4 };
        var t = new Label
        {
            Text = title,
            ForeColor = fg,
            Font = new Font("Segoe UI", 11f, FontStyle.Bold),
            AutoSize = false,
            Location = new Point(20, 14),
            Size = new Size(width - 40, 24),
            BackColor = Color.Transparent
        };
        var b = new Label
        {
            Text = body,
            ForeColor = sub,
            Font = new Font("Segoe UI", 9.5f),
            AutoSize = false,
            AutoEllipsis = true,
            Location = new Point(20, 42),
            Size = new Size(width - 40, 54),
            BackColor = Color.Transparent
        };
        Controls.Add(bar);
        Controls.Add(t);
        Controls.Add(b);

        // Follow the monitor the mouse is on, not the primary monitor.
        Screen screen = Screen.FromPoint(Cursor.Position);
        screenName = screen.DeviceName;
        screenBounds = screen.Bounds;
        var wa = screen.WorkingArea;
        int x, y;
        switch (corner)
        {
            case "bl": x = wa.Left + mx; y = wa.Bottom - Height - my; break;
            case "tr": x = wa.Right - Width - mx; y = wa.Top + my; break;
            case "tl": x = wa.Left + mx; y = wa.Top + my; break;
            default: x = wa.Right - Width - mx; y = wa.Bottom - Height - my; break;
        }
        Location = new Point(x, y);
        DshActions.Log("popup screen=" + screenName + " bounds=" + screenBounds + " work=" + wa + " cursor=" + Cursor.Position + " corner=" + corner + " pos=" + Location + " size=" + Size);

        timer = new System.Windows.Forms.Timer { Interval = timeoutMs };
        timer.Tick += (s, e) => { timer.Stop(); Close(); };

        var keep = new System.Windows.Forms.Timer { Interval = 1000 };
        keep.Tick += (s, e) => DshActions.KeepTop(Handle);
        keep.Start();

        EventHandler onClick = (s, e) =>
        {
            try { DshActions.Log("click handler"); DshActions.FocusDsh(Handle); }
            catch (Exception ex) { DshActions.Log("click-error " + ex.Message); }
            try { timer.Stop(); Close(); } catch { }
        };
        Click += onClick;
        t.Click += onClick;
        b.Click += onClick;

        MouseEnter += (s, e) => timer.Stop();
        MouseLeave += (s, e) => timer.Start();
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= 0x08000000; // WS_EX_NOACTIVATE
            cp.ExStyle |= 0x00000080; // WS_EX_TOOLWINDOW
            return cp;
        }
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        DshActions.ClearTopmost();
        if (Env("DSH_NOTIFY_SOUND", "1") != "0")
        {
            try { System.Media.SystemSounds.Asterisk.Play(); } catch { }
        }
        timer.Start();
    }
}
'@

[DshActions]::LogPath = $logPath

if ($Diagnose) {
    foreach ($line in [DshActions]::DumpWindows()) { [DshActions]::Log($line) }
    exit 0
}

if (-not $Quiet) {
    $form = New-Object DshToast($title, $body, $timeoutMs)
    [System.Windows.Forms.Application]::Run($form)
}
