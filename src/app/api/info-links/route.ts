import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type InfoLinkPayload = {
    title?: string;
    url?: string;
    description?: string | null;
};

function normalizeUrl(input: string) {
    const value = input.trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
}

function isValidHttpUrl(input: string) {
    try {
        const parsed = new URL(input);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return { supabase, user: null, error: 'No autenticado' as const };
    }

    return { supabase, user, error: null };
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
    const { data, error } = await supabase
        .from('admins')
        .select('uid')
        .eq('uid', userId)
        .single();

    if (error || !data) return false;
    return true;
}

export async function GET() {
    const { supabase, user, error } = await requireAuth();

    if (error || !user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data, error: queryError } = await supabase
        .from('info_links')
        .select('id, title, url, description, order_index, created_at, updated_at')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    if (queryError) {
        if (/info_links/i.test(queryError.message) && /does not exist/i.test(queryError.message)) {
            return NextResponse.json({ links: [] });
        }
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ links: data || [] });
}

export async function POST(request: NextRequest) {
    const { supabase, user, error } = await requireAuth();

    if (error || !user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isAdmin = await requireAdmin(supabase, user.id);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Solo admins pueden crear enlaces de info.' }, { status: 403 });
    }

    const body = (await request.json()) as InfoLinkPayload;
    const title = (body.title || '').trim();
    const url = normalizeUrl(body.url || '');
    const description = (body.description || '').trim() || null;

    if (!title || !url) {
        return NextResponse.json({ error: 'Titulo y URL son obligatorios.' }, { status: 400 });
    }

    if (!isValidHttpUrl(url)) {
        return NextResponse.json({ error: 'La URL debe comenzar con http:// o https://.' }, { status: 400 });
    }

    const { data: currentMaxRow } = await supabase
        .from('info_links')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = typeof currentMaxRow?.order_index === 'number' ? currentMaxRow.order_index + 1 : 0;

    const { data, error: insertError } = await supabase
        .from('info_links')
        .insert({ title, url, description, order_index: nextOrder, created_by: user.id })
        .select('id, title, url, description, order_index, created_at, updated_at')
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, link: data });
}

export async function PUT(request: NextRequest) {
    const { supabase, user, error } = await requireAuth();

    if (error || !user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isAdmin = await requireAdmin(supabase, user.id);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Solo admins pueden editar enlaces de info.' }, { status: 403 });
    }

    const body = (await request.json()) as InfoLinkPayload & { id?: string; order_index?: number };
    const id = (body.id || '').trim();

    if (!id) {
        return NextResponse.json({ error: 'Falta el id del enlace.' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};

    if (typeof body.title === 'string') {
        const title = body.title.trim();
        if (!title) return NextResponse.json({ error: 'El titulo no puede estar vacio.' }, { status: 400 });
        payload.title = title;
    }

    if (typeof body.url === 'string') {
        const normalized = normalizeUrl(body.url);
        if (!isValidHttpUrl(normalized)) {
            return NextResponse.json({ error: 'La URL debe comenzar con http:// o https://.' }, { status: 400 });
        }
        payload.url = normalized;
    }

    if (typeof body.description === 'string') {
        payload.description = body.description.trim() || null;
    }

    if (typeof body.order_index === 'number' && Number.isFinite(body.order_index)) {
        payload.order_index = body.order_index;
    }

    if (Object.keys(payload).length === 0) {
        return NextResponse.json({ error: 'No hay campos para actualizar.' }, { status: 400 });
    }

    const { data, error: updateError } = await supabase
        .from('info_links')
        .update(payload)
        .eq('id', id)
        .select('id, title, url, description, order_index, created_at, updated_at')
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, link: data });
}

export async function DELETE(request: NextRequest) {
    const { supabase, user, error } = await requireAuth();

    if (error || !user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isAdmin = await requireAdmin(supabase, user.id);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Solo admins pueden eliminar enlaces de info.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();

    if (!id) {
        return NextResponse.json({ error: 'Falta el id del enlace.' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
        .from('info_links')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
