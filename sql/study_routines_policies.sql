DROP POLICY IF EXISTS \
Usuários
podem
visualizar
suas
próprias
rotinas
de
estudo\ ON study_routines; CREATE POLICY \Usuários
podem
visualizar
suas
próprias
rotinas
de
estudo\ ON study_routines FOR SELECT USING (auth.uid() = user_id); DROP POLICY IF EXISTS \Usuários
podem
inserir
suas
próprias
rotinas
de
estudo\ ON study_routines; CREATE POLICY \Usuários
podem
inserir
suas
próprias
rotinas
de
estudo\ ON study_routines FOR INSERT WITH CHECK (auth.uid() = user_id); DROP POLICY IF EXISTS \Usuários
podem
atualizar
suas
próprias
rotinas
de
estudo\ ON study_routines; CREATE POLICY \Usuários
podem
atualizar
suas
próprias
rotinas
de
estudo\ ON study_routines FOR UPDATE USING (auth.uid() = user_id); DROP POLICY IF EXISTS \Usuários
podem
excluir
suas
próprias
rotinas
de
estudo\ ON study_routines; CREATE POLICY \Usuários
podem
excluir
suas
próprias
rotinas
de
estudo\ ON study_routines FOR DELETE USING (auth.uid() = user_id);
