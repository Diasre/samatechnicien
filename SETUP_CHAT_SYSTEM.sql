-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create table for Conversations (linking two users)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    participant2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id)
);

-- 2. Create table for Direct Messages
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Grid/RLS (Row Level Security)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Conversations
-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Users can create a conversation (if they are one of the participants)
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- 5. Policies for Direct Messages
-- Users can view messages of conversations they belong to
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = direct_messages.conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- Users can send messages to conversations they belong to
CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- 6. Helper Function to get or create a conversation
-- ensuring consistent ordering of participants to avoid duplicates (A,B) vs (B,A)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p1 UUID, p2 UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
    user_a UUID;
    user_b UUID;
BEGIN
    -- Order participants to ensure uniqueness (smaller ID first)
    IF p1 < p2 THEN
        user_a := p1;
        user_b := p2;
    ELSE
        user_a := p2;
        user_b := p1;
    END IF;

    -- Check if conversation exists
    SELECT id INTO conv_id
    FROM public.conversations
    WHERE participant1_id = user_a AND participant2_id = user_b;

    -- If not, create it
    IF conv_id IS NULL THEN
        INSERT INTO public.conversations (participant1_id, participant2_id)
        VALUES (user_a, user_b)
        RETURNING id INTO conv_id;
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.direct_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;
