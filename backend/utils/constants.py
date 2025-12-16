class RoleKeys:
    IS_SUPERADMIN = "is_superadmin"
    IS_VENDEDOR = "is_vendedor"
    IS_USUARIO = "is_usuario"
    IS_CLIENTE = "is_cliente" # Future proofing
    ROLE_ID = "fk_rol" # Or "rol_id" if we standardize. Keeping current usage to minimize breakage for now, or standardizing?
    # Current usage in strategies.py: "fk_rol" for superadmin/vendedor (dummy -1, -2), and "fk_rol" for User (DB column).
    # Since User table now has "rol_id", we should probably standardize to "rol_id" in the USER object dict too, 
    # but require_role dependency checks "fk_rol".
    # DECISION: CONSTANT_NAME = "key_in_dict"
    
    # We will use "rol_id" for the dict key to match new schema, 
    # BUT we need to update dependencies to look for "rol_id".
    ROL_ID = "rol_id"
