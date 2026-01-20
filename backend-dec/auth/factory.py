from auth.strategies import SuperadminAuthStrategy, VendedorAuthStrategy, UsuarioAuthStrategy

class AuthFactory:
    @staticmethod
    def get_strategy(role: str):
        if role == "superadmin":
            return SuperadminAuthStrategy()
        elif role == "vendedor":
            return VendedorAuthStrategy()
        else:
            return UsuarioAuthStrategy()
