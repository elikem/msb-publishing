class MagicLink
  PURPOSE = "magic_link"
  EXPIRY = 15.minutes

  class << self
    def generate_for(user)
      payload = {
        user_id: user.id,
        email: user.email,
        exp: EXPIRY.from_now.to_i
      }
      verifier.generate(payload, purpose: PURPOSE)
    end

    def verify(token)
      payload = verifier.verify(token, purpose: PURPOSE)
      return nil if payload["exp"].to_i < Time.current.to_i

      User.find_by(id: payload["user_id"], email: payload["email"])
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      nil
    end

    private

    def verifier
      Rails.application.message_verifier("magic_link_login")
    end
  end
end
