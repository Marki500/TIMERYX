-- Function to accept workspace invitation
CREATE OR REPLACE FUNCTION accept_workspace_invitation(p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation workspace_invitations%ROWTYPE;
    v_user_id UUID;
    v_existing_member INT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Find valid invitation
    SELECT * INTO v_invitation
    FROM workspace_invitations
    WHERE token = p_token
    AND expires_at > NOW();

    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION 'Invitación inválida o expirada';
    END IF;

    -- Check if already a member
    SELECT 1 INTO v_existing_member
    FROM workspace_members
    WHERE workspace_id = v_invitation.workspace_id
    AND user_id = v_user_id;

    IF v_existing_member IS NOT NULL THEN
        -- Already a member, just delete invitation
        DELETE FROM workspace_invitations WHERE id = v_invitation.id;
        RETURN;
    END IF;

    -- Insert into workspace_members
    -- Cast role to workspace_role enum if necessary, or ensure input matches enum
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (v_invitation.workspace_id, v_user_id, v_invitation.role::workspace_role);

    -- Delete invitation (and any other invitations for this user/workspace)
    DELETE FROM workspace_invitations 
    WHERE id = v_invitation.id 
    OR (workspace_id = v_invitation.workspace_id AND email = v_invitation.email);

END;
$$;
