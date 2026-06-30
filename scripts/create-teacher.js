require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error("Usage: node scripts/create-teacher.js <name> <email> <password>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("teachers")
    .insert({ name, email, password_hash })
    .select()
    .single();

  if (error) {
    console.error("FULL ERROR:", error);
    process.exit(1);
  }

  console.log("Teacher account created:", data.email);
}

main();